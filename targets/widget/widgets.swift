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
        VStack(alignment: .leading, spacing: 6) {
            ForEach(["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"], id: \.self) { prayer in
                HStack {
                    Text(prayer)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                    Spacer()
                    Text(entry.prayerTimes[prayer] ?? "--:--")
                        .font(.caption2)
                        .foregroundColor(.primary)
                }
            }
        }
        .padding()
    }
}

// MARK: - Widget Declaration
struct PrayerTimesWidget: Widget {
    let kind: String = "PrayerTimesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PrayerTimesWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
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
