import WidgetKit
import SwiftUI

// MARK: - Models
struct PrayerDay: Codable {
    let date: String
    let time: [String: String]
}

struct PrayerTimesEntry: TimelineEntry {
    let date: Date
    let prayerTimes: [String: String]
    let lastUpdated: Date?
    let dataSource: DataSource
    
    enum DataSource {
        case live, sample, error
    }
}

// MARK: - Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerTimesEntry {
        PrayerTimesEntry(
            date: Date(),
            prayerTimes: samplePrayerTimes,
            lastUpdated: nil,
            dataSource: .sample
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
        let (times, lastUpdated, source) = loadPrayerTimesForToday()
        let entry = PrayerTimesEntry(
            date: Date(),
            prayerTimes: times,
            lastUpdated: lastUpdated,
            dataSource: source
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
        let (times, lastUpdated, source) = loadPrayerTimesForToday()
        var entries: [PrayerTimesEntry] = []

        let calendar = Calendar.current
        let currentDate = Date()

        // Create entries for every hour
        for hourOffset in 0..<24 {
            if let entryDate = calendar.date(byAdding: .hour, value: hourOffset, to: currentDate) {
                let entry = PrayerTimesEntry(
                    date: entryDate,
                    prayerTimes: times,
                    lastUpdated: lastUpdated,
                    dataSource: source
                )
                entries.append(entry)
            }
        }

        // Refresh at midnight
        let midnight = calendar.startOfDay(for: currentDate.addingTimeInterval(86400))
        let timeline = Timeline(entries: entries, policy: .after(midnight))
        completion(timeline)
    }

    // ✅ Returns (prayerTimes, lastUpdated, dataSource)
    private func loadPrayerTimesForToday() -> ([String: String], Date?, PrayerTimesEntry.DataSource) {
        let suiteName = "group.com.rihlah.prayerTimesWidget"
        let key = "prayerTimes2025"
        let timestampKey = "lastUpdated"

        guard let userDefaults = UserDefaults(suiteName: suiteName) else {
            print("❌ Cannot access shared UserDefaults")
            return (samplePrayerTimes, nil, .error)
        }
        
        // Get last updated timestamp
        var lastUpdated: Date?
        if let timestampString = userDefaults.string(forKey: timestampKey),
           let timestamp = ISO8601DateFormatter().date(from: timestampString) {
            lastUpdated = timestamp
            print("✅ Last updated:", timestamp)
        }
        
        guard let jsonString = userDefaults.string(forKey: key),
              let jsonData = jsonString.data(using: .utf8) else {
            print("⚠️ No prayer data found, using sample")
            return (samplePrayerTimes, lastUpdated, .sample)
        }

        do {
            let prayerList = try JSONDecoder().decode([PrayerDay].self, from: jsonData)
            let formatter = DateFormatter()
            formatter.dateFormat = "d/M/yyyy"
            let todayKey = formatter.string(from: Date())

            if let todayData = prayerList.first(where: { $0.date == todayKey }) {
                print("✅ Loaded prayer times for:", todayKey)
                return (todayData.time.mapKeys { $0.capitalized }, lastUpdated, .live)
            } else {
                print("⚠️ No data for today:", todayKey)
                return (samplePrayerTimes, lastUpdated, .sample)
            }
        } catch {
            print("❌ JSON decode error:", error.localizedDescription)
            return (samplePrayerTimes, lastUpdated, .error)
        }
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

// MARK: - 🆕 Standardized Lock Screen Component
struct LockScreenPrayerTimesView: View {
    let entry: PrayerTimesEntry
    let prayers: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(prayers, id: \.self) { prayer in
                let time = entry.prayerTimes[prayer] ?? "--:--"
                let isPast = hasPrayerPassed(prayer, entry: entry)

                HStack(spacing: 6) {
                    Text(prayer)
                        .font(.system(size: 13, weight: .semibold))
                        .frame(width: 52, alignment: .leading)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                        .foregroundColor(isPast ? .gray : .white)

                    Text(time)
                        .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        .foregroundColor(isPast ? .gray : .white)
                }
                .opacity(isPast ? 0.6 : 1.0)
            }
            
            // ✅ Data freshness indicator (only show if data is old)
            if let lastUpdated = entry.lastUpdated {
                let hoursSinceUpdate = Date().timeIntervalSince(lastUpdated) / 3600
                if hoursSinceUpdate > 24 {
                    HStack(spacing: 2) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 8))
                        Text("Stale")
                            .font(.system(size: 8, weight: .medium))
                    }
                    .foregroundColor(.orange)
                    .padding(.top, 2)
                }
            }
        }
    }
}

// MARK: - Home Widget View
struct PrayerTimesWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: PrayerTimesEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // ✅ Header with data source indicator
            HStack {
                Text("Prayer Times")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                if entry.dataSource == .sample {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.system(size: 10))
                        .foregroundColor(.orange)
                }
            }
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"], id: \.self) { prayer in
                    let time = entry.prayerTimes[prayer] ?? "--:--"
                    let isPast = hasPrayerPassed(prayer, entry: entry)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(prayer)
                            .font(.system(size: 11, weight: .semibold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .foregroundStyle(isPast ? .secondary : .primary)

                        Text(time)
                            .font(.system(size: 13, design: .monospaced))
                            .foregroundStyle(isPast ? .secondary : .primary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .opacity(isPast ? 0.5 : 1.0)
                }
            }
        }
        .padding(12)
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
        .description("All 6 daily prayer times")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct LeftPrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LeftPrayerTimesWidget", provider: Provider()) { entry in
            LockScreenPrayerTimesView(
                entry: entry,
                prayers: ["Subuh", "Syuruk", "Zohor"]
            )
            .containerBackground(.ultraThinMaterial, for: .widget)
        }
        .configurationDisplayName("Prayer Times (Morning)")
        .description("Subuh, Syuruk, Zohor")
        .supportedFamilies([.accessoryRectangular])
    }
}

struct RightPrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "RightPrayerTimesWidget", provider: Provider()) { entry in
            LockScreenPrayerTimesView(
                entry: entry,
                prayers: ["Asar", "Maghrib", "Isyak"]
            )
            .containerBackground(.ultraThinMaterial, for: .widget)
        }
        .configurationDisplayName("Prayer Times (Evening)")
        .description("Asar, Maghrib, Isyak")
        .supportedFamilies([.accessoryRectangular])
    }
}
