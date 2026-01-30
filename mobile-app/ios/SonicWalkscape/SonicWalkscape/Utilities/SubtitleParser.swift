//
//  SubtitleParser.swift
//  SonicWalkscape
//
//  Parses .srt subtitle files and matches text to audio playback time
//

import Foundation

/// Represents a single subtitle entry with time codes and text
struct Subtitle {
    let startTime: TimeInterval
    let endTime: TimeInterval
    let text: String

    /// Check if this subtitle should be displayed at the given time
    func isActive(at time: TimeInterval) -> Bool {
        return time >= startTime && time <= endTime
    }
}

/// Parser for .srt (SubRip) subtitle files
class SubtitleParser {

    /// Parse .srt file content and return array of subtitles
    static func parse(_ srtContent: String) -> [Subtitle] {
        var subtitles: [Subtitle] = []

        // Split into blocks (separated by double newlines)
        let blocks = srtContent.components(separatedBy: "\n\n")

        for block in blocks {
            let lines = block.components(separatedBy: "\n").filter { !$0.isEmpty }

            // Each block should have at least: index, timecode, text
            guard lines.count >= 3 else { continue }

            // Parse time code (line 2): "00:00:05,500 --> 00:00:10,000"
            let timecodeLine = lines[1]
            guard let (startTime, endTime) = parseTimecode(timecodeLine) else {
                continue
            }

            // Text is everything from line 3 onwards
            let text = lines[2...].joined(separator: "\n")

            subtitles.append(Subtitle(
                startTime: startTime,
                endTime: endTime,
                text: text
            ))
        }

        return subtitles
    }

    /// Parse timecode string: "00:00:05,500 --> 00:00:10,000"
    private static func parseTimecode(_ line: String) -> (TimeInterval, TimeInterval)? {
        let parts = line.components(separatedBy: " --> ")
        guard parts.count == 2 else { return nil }

        guard let start = parseTime(parts[0]),
              let end = parseTime(parts[1]) else {
            return nil
        }

        return (start, end)
    }

    /// Parse time string: "00:00:05,500" to TimeInterval
    private static func parseTime(_ timeString: String) -> TimeInterval? {
        // Format: HH:MM:SS,mmm
        let cleaned = timeString.trimmingCharacters(in: .whitespaces)
        let parts = cleaned.replacingOccurrences(of: ",", with: ".").components(separatedBy: ":")

        guard parts.count == 3 else { return nil }

        guard let hours = Double(parts[0]),
              let minutes = Double(parts[1]),
              let seconds = Double(parts[2]) else {
            return nil
        }

        return hours * 3600 + minutes * 60 + seconds
    }

    /// Get the subtitle that should be displayed at a given time
    static func subtitle(at time: TimeInterval, in subtitles: [Subtitle]) -> Subtitle? {
        return subtitles.first { $0.isActive(at: time) }
    }
}
