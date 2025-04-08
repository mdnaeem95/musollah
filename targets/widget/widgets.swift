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
    let entry: PrayerTimesEntry

    var body: some View {
        let columns = [
            GridItem(.flexible(), spacing: 8),
            GridItem(.flexible())
        ]

        LazyVGrid(columns: columns, spacing: 8) {
            ForEach(["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"], id: \.self) { prayer in
                let isPast = hasPrayerPassed(prayerName: prayer, prayerTimes: entry.prayerTimes, now: entry.date)

                VStack(alignment: .leading, spacing: 2) {
                    Text(prayer)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(isPast ? .secondary : .primary)

                    Text(entry.prayerTimes[prayer] ?? "--:--")
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundStyle(isPast ? .secondary : .primary)
                        .strikethrough(isPast, color: .secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(8) // Compact padding
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
                .containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("Prayer Times")
        .description("Displays today's six daily prayer times.")
        .supportedFamilies([.systemSmall, .systemMedium])
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
