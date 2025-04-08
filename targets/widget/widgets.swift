import WidgetKit
import SwiftUI

// MARK: - Model
struct PrayerDay: Codable {
    let date: String // "d/M/yyyy"
    let time: [String: String]
}

// MARK: - Timeline Entry
struct PrayerTimesEntry: TimelineEntry {
    let date: Date
    let prayerTimes: [String: String]
}

// MARK: - Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerTimesEntry {
        PrayerTimesEntry(date: Date(), prayerTimes: samplePrayerTimes())
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: loadPrayerTimesForToday())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: loadPrayerTimesForToday())

        // Refresh at midnight
        let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
        let timeline = Timeline(entries: [entry], policy: .after(tomorrow))
        completion(timeline)
    }

    private func loadPrayerTimesForToday() -> [String: String] {
        let suiteName = "group.com.rihlah.prayerTimesWidget"
        guard let userDefaults = UserDefaults(suiteName: suiteName),
              let jsonString = userDefaults.string(forKey: "prayerTimes2025"),
              let jsonData = jsonString.data(using: .utf8) else {
            print("❌ Could not load prayerTimes2025 from UserDefaults")
            return samplePrayerTimes()
        }

        do {
            let prayerList = try JSONDecoder().decode([PrayerDay].self, from: jsonData)
            let formatter = DateFormatter()
            formatter.dateFormat = "d/M/yyyy"
            let todayKey = formatter.string(from: Date())

            if let todayData = prayerList.first(where: { $0.date == todayKey }) {
                print("✅ Loaded prayer times for \(todayKey)")
                return todayData.time
            } else {
                print("❌ No data found for today's date: \(todayKey)")
            }
        } catch {
            print("❌ JSON decode error:", error.localizedDescription)
        }

        return samplePrayerTimes()
    }

    private func samplePrayerTimes() -> [String: String] {
        return [
            "Subuh": "05:45",
            "Syuruk": "07:03",
            "Zohor": "13:03",
            "Asar": "16:27",
            "Maghrib": "19:06",
            "Isyak": "20:20"
        ]
    }
}

// MARK: - Widget View
struct PrayerTimesWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: PrayerTimesEntry

    var body: some View {
        switch family {
        case .systemSmall:
            smallWidgetView
        case .accessoryRectangular:
            lockScreenView
        default:
            homeScreenView
        }
    }

    // MARK: - Small Widget (next prayer)
    private var smallWidgetView: some View {
        if let next = getNextPrayer() {
            VStack(alignment: .center, spacing: 4) {
                Text("Next")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                Text(next.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(next.time)
                    .font(.system(.body, design: .monospaced))
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(8)
        } else {
            Text("No Data")
        }
    }

    // MARK: - Home Screen Layout (Grid)
    private var homeScreenView: some View {
        let columns = [GridItem(.flexible(), spacing: 8), GridItem(.flexible())]

        return LazyVGrid(columns: columns, spacing: 8) {
            ForEach(prayers, id: \.self) { prayer in
                prayerBlock(prayer)
            }
        }
        .padding(8)
    }

    // MARK: - Lock Screen Layout (Mini-grid)
    private var lockScreenView: some View {
        let columns = [GridItem(.flexible()), GridItem(.flexible())]

        return LazyVGrid(columns: columns, spacing: 4) {
            ForEach(prayers, id: \.self) { prayer in
                let isPast = hasPrayerPassed(prayer, now: entry.date)

                VStack(alignment: .leading, spacing: 0) {
                    Text(prayer.prefix(3))
                        .font(.caption2)
                        .foregroundStyle(isPast ? .secondary : .primary)

                    Text(entry.prayerTimes[prayer] ?? "--:--")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(isPast ? .secondary : .primary)
                        .strikethrough(isPast, color: .secondary)
                }
            }
        }
    }

    // MARK: - Shared Prayer Block
    private func prayerBlock(_ prayer: String) -> some View {
        let isPast = hasPrayerPassed(prayer, now: entry.date)

        return HStack {
            Text(prayer)
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundStyle(isPast ? .secondary : .primary)

            Spacer(minLength: 6)

            Text(entry.prayerTimes[prayer] ?? "--:--")
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(isPast ? .secondary : .primary)
                .strikethrough(isPast, color: .secondary)
        }
    }

    // MARK: - Helpers
    private var prayers: [String] {
        ["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"]
    }

    private func getNextPrayer() -> (name: String, time: String)? {
        for prayer in prayers {
            if !hasPrayerPassed(prayer, now: entry.date),
               let time = entry.prayerTimes[prayer] {
                return (prayer, time)
            }
        }
        return nil
    }

    private func hasPrayerPassed(_ prayer: String, now: Date) -> Bool {
        guard let timeString = entry.prayerTimes[prayer],
              let prayerDate = timeStringToDate(timeString, now: now) else {
            return false
        }
        return now >= prayerDate
    }

    private func timeStringToDate(_ time: String, now: Date) -> Date? {
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month, .day], from: now)
        let parts = time.split(separator: ":").compactMap { Int($0) }
        if parts.count == 2 {
            components.hour = parts[0]
            components.minute = parts[1]
            return calendar.date(from: components)
        }
        return nil
    }
}

// MARK: - Widget Declaration
struct PrayerTimesWidget: Widget {
    let kind: String = "PrayerTimesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PrayerTimesWidgetView(entry: entry)
                .containerBackground(.ultraThinMaterial, for: .widget)
        }
        .configurationDisplayName("Prayer Times")
        .description("Displays today's six daily prayer times.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

// MARK: - Widget Preview
#Preview(as: .systemMedium) {
    PrayerTimesWidget()
} timeline: {
    PrayerTimesEntry(date: .now, prayerTimes: [
        "Subuh": "05:40",
        "Syuruk": "07:01",
        "Zohor": "13:02",
        "Asar": "16:26",
        "Maghrib": "19:05",
        "Isyak": "20:18"
    ])
}

#Preview(as: .systemSmall) {
    PrayerTimesWidget()
} timeline: {
    PrayerTimesEntry(date: .now, prayerTimes: [
        "Subuh": "05:40",
        "Syuruk": "07:01",
        "Zohor": "13:02",
        "Asar": "16:26",
        "Maghrib": "19:05",
        "Isyak": "20:18"
    ])
}