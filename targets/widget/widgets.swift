import WidgetKit
import SwiftUI

// MARK: - Timeline Entry
struct PrayerTimesEntry: TimelineEntry {
    let date: Date
    let prayerTimes: [String: String]
}

// MARK: - Timeline Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerTimesEntry {
        PrayerTimesEntry(date: Date(), prayerTimes: samplePrayerTimes())
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: loadPrayerTimes())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: loadPrayerTimes())

        // Update hourly (you can change this to .atEnd if you'd rather refresh once a day)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadPrayerTimes() -> [String: String] {
        let suiteName = "group.com.rihlah.prayerTimesWidget"
        guard let userDefaults = UserDefaults(suiteName: suiteName) else {
            print("❌ Could not access UserDefaults for suite:", suiteName)
            return samplePrayerTimes()
        }

        let keys = userDefaults.dictionaryRepresentation().keys
        print("🔍 UserDefaults keys:", keys)

        if let jsonString = userDefaults.string(forKey: "prayerTimes") {
            print("📦 Widget received JSON string:", jsonString)

            if let jsonData = jsonString.data(using: .utf8) {
                do {
                    let decoded = try JSONDecoder().decode([String: String].self, from: jsonData)
                    print("✅ Successfully decoded prayer times:", decoded)
                    return decoded
                } catch {
                    print("❌ JSON decode error:", error.localizedDescription)
                }
            } else {
                print("❌ Failed to convert JSON string to Data")
            }
        } else {
            print("❌ No value found for key: 'prayerTimes'")
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
        case .accessoryRectangular:
            lockScreenView
        default:
            homeScreenView
        }
    }

    // MARK: - Home Screen Layout (Grid)
    private var homeScreenView: some View {
        let columns = [
            GridItem(.flexible(), spacing: 8),
            GridItem(.flexible())
        ]

        return LazyVGrid(columns: columns, spacing: 8) {
            ForEach(prayers, id: \.self) { prayer in
                prayerBlock(prayer)
            }
        }
        .padding(8)
    }

    // MARK: - Lock Screen Layout (Stacked)
    private var lockScreenView: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(prayers, id: \.self) { prayer in
                prayerBlock(prayer)
            }
        }
    }

    // MARK: - Shared Prayer Block
    private func prayerBlock(_ prayer: String) -> some View {
        let isPast = hasPrayerPassed(prayerName: prayer, prayerTimes: entry.prayerTimes, now: entry.date)

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

    // MARK: - Helper
    private var prayers: [String] {
        ["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"]
    }

    private func hasPrayerPassed(prayerName: String, prayerTimes: [String: String], now: Date) -> Bool {
        guard let timeString = prayerTimes[prayerName],
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
