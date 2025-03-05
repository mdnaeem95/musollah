import WidgetKit
import SwiftUI

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), hasData: false, configuration: ConfigurationAppIntent())
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        let hasData = checkForStoredData()
        return SimpleEntry(date: Date(), hasData: hasData, configuration: configuration)
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        var entries: [SimpleEntry] = []

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        let hasData = checkForStoredData()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, hasData: hasData, configuration: configuration)
            entries.append(entry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }

    // Function to check if prayerTimesToday is stored
    private func checkForStoredData() -> Bool {
        let defaults = UserDefaults(suiteName: "group.com.rihlah.prayerTimesWidget")
        if let storedData = defaults?.string(forKey: "prayerTimesToday") {
            print("🟢 Widget Retrieved Data:", storedData) // Debugging log
            return true
        }
        print("❌ No stored prayer times found")
        return false
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let hasData: Bool
    let configuration: ConfigurationAppIntent
}

struct widgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            if entry.hasData {
                Text("Data available ✅")
                    .font(.headline)
                    .foregroundColor(.green)
            } else {
                Text("No data ❌")
                    .font(.headline)
                    .foregroundColor(.red)
            }
        }
    }
}

struct PrayerTimesWidget: Widget {
    let kind: String = "PrayerTimesWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .systemSmall) {
    PrayerTimesWidget()
} timeline: {
    SimpleEntry(date: .now, hasData: true, configuration: ConfigurationAppIntent.smiley)
    SimpleEntry(date: .now, hasData: false, configuration: ConfigurationAppIntent.starEyes)
}
