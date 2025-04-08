import WidgetKit
import SwiftUI

// MARK: - Models
struct PrayerDay: Codable {
    let date: String // "d/M/yyyy"
    let time: [String: String]
}

struct PrayerTimesEntry: TimelineEntry {
    let date: Date
    let prayerTimes: [String: String]
}

// MARK: - Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerTimesEntry {
        PrayerTimesEntry(date: Date(), prayerTimes: samplePrayerTimes)
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: loadPrayerTimesForToday())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: loadPrayerTimesForToday())
        let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
        completion(Timeline(entries: [entry], policy: .after(tomorrow)))
    }

    private func loadPrayerTimesForToday() -> [String: String] {
        let suiteName = "group.com.rihlah.prayerTimesWidget"
        let key = "prayerTimes2025"

        guard let userDefaults = UserDefaults(suiteName: suiteName),
              let jsonString = userDefaults.string(forKey: key),
              let jsonData = jsonString.data(using: .utf8) else {
            return samplePrayerTimes
        }

        do {
            let prayerList = try JSONDecoder().decode([PrayerDay].self, from: jsonData)
            let formatter = DateFormatter()
            formatter.dateFormat = "d/M/yyyy"
            let todayKey = formatter.string(from: Date())

            if let todayData = prayerList.first(where: { $0.date == todayKey }) {
                return todayData.time.mapKeys { $0.capitalized }
            }
        } catch {
            print("❌ JSON decode error:", error.localizedDescription)
        }

        return samplePrayerTimes
    }

    private var samplePrayerTimes: [String: String] {
        [
            "Subuh": "05:45",
            "Syuruk": "07:03",
            "Zohor": "13:03",
            "Asar": "16:27",
            "Maghrib": "19:06",
            "Isyak": "20:20"
        ]
    }
}

// MARK: - Shared Helpers
extension Dictionary {
    func mapKeys<T: Hashable>(_ transform: (Key) -> T) -> [T: Value] {
        Dictionary<T, Value>(uniqueKeysWithValues: self.map { (transform($0.key), $0.value) })
    }
}

// MARK: - Shared Time Logic
func hasPrayerPassed(_ prayer: String, entry: PrayerTimesEntry) -> Bool {
    guard let timeString = entry.prayerTimes[prayer],
          let date = timeStringToDate(timeString, now: entry.date) else {
        return false
    }
    return entry.date >= date
}

func timeStringToDate(_ time: String, now: Date) -> Date? {
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

// MARK: - Home Widget View (3x2 Grid)
struct PrayerTimesWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: PrayerTimesEntry

    var body: some View {
        switch family {
        case .accessoryRectangular:
            EmptyView() // handled separately
        default:
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                ForEach(["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"], id: \.self) { prayer in
                    let time = entry.prayerTimes[prayer] ?? "--:--"
                    let isPast = hasPrayerPassed(prayer, entry: entry)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(prayer)
                            .font(.system(size: 10, weight: .semibold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .foregroundStyle(isPast ? .secondary : .primary)
                            .strikethrough(isPast, color: .secondary)

                        Text(time)
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundStyle(isPast ? .secondary : .primary)
                            .strikethrough(isPast, color: .secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(10)
        }
    }
}

// MARK: - Lock Screen Left
struct LeftPrayerTimesWidgetView: View {
    let entry: PrayerTimesEntry
    var prayers: [String] = ["Subuh", "Syuruk", "Zohor"]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(prayers, id: \.self) { prayer in
                let time = entry.prayerTimes[prayer] ?? "--:--"
                let isPast = hasPrayerPassed(prayer, entry: entry)

                HStack {
                    Text(prayer)
                        .font(.system(size: 13, weight: .semibold))
                        .frame(width: 50, alignment: .leading) // Increase width for longer names like "Maghrib"
                        .lineLimit(1)
                        .minimumScaleFactor(0.9) // Less aggressive scaling
                        .foregroundColor(isPast ? .gray : .white)
                        .strikethrough(isPast, color: .secondary)


                    Text(time)
                        .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        .foregroundStyle(isPast ? .gray : .white)
                        .strikethrough(isPast, color: .secondary)
                }
            }
        }
    }
}

// MARK: - Lock Screen Right
struct RightPrayerTimesWidgetView: View {
    let entry: PrayerTimesEntry
    var prayers: [String] = ["Asar", "Maghrib", "Isyak"]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(prayers, id: \.self) { prayer in
                let time = entry.prayerTimes[prayer] ?? "--:--"
                let isPast = hasPrayerPassed(prayer, entry: entry)

                HStack {
                    Text(prayer)
                        .font(.system(size: 13, weight: .semibold))
                        .frame(width: 50, alignment: .leading) // Increase width for longer names like "Maghrib"
                        .lineLimit(1)
                        .minimumScaleFactor(0.9) // Less aggressive scaling
                        .foregroundColor(isPast ? .gray : .white)
                        .strikethrough(isPast, color: .secondary)

                    Text(time)
                        .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        .foregroundColor(isPast ? .gray : .white)
                        .strikethrough(isPast, color: .secondary)
                }
            }
        }
    }
}

// MARK: - Widget Declarations
struct PrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PrayerTimesWidget", provider: Provider()) { entry in
            PrayerTimesWidgetView(entry: entry)
                .containerBackground(.ultraThinMaterial, for: .widget)
        }
        .configurationDisplayName("Prayer Times")
        .description("Full 6 prayer times")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct LeftPrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LeftPrayerTimesWidget", provider: Provider()) { entry in
            LeftPrayerTimesWidgetView(entry: entry)
                .containerBackground(.ultraThinMaterial, for: .widget)
        }
        .configurationDisplayName("Prayer Times (1/2)")
        .description("Subuh, Syuruk, Zohor")
        .supportedFamilies([.accessoryRectangular])
    }
}

struct RightPrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "RightPrayerTimesWidget", provider: Provider()) { entry in
            RightPrayerTimesWidgetView(entry: entry)
                .containerBackground(.ultraThinMaterial, for: .widget)
        }
        .configurationDisplayName("Prayer Times (2/2)")
        .description("Asar, Maghrib, Isyak")
        .supportedFamilies([.accessoryRectangular])
    }
}