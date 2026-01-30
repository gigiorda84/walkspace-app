package com.bandite.sonicwalkscape.utils

/**
 * Parser for SRT (SubRip) subtitle files
 */
object SubtitleParser {

    data class Subtitle(
        val index: Int,
        val startTimeMs: Long,
        val endTimeMs: Long,
        val text: String
    )

    /**
     * Parse SRT content into a list of Subtitle objects
     */
    fun parse(srtContent: String): List<Subtitle> {
        val subtitles = mutableListOf<Subtitle>()
        val blocks = srtContent.trim().split(Regex("\n\n+"))

        for (block in blocks) {
            val lines = block.trim().split("\n")
            if (lines.size < 3) continue

            try {
                val index = lines[0].trim().toIntOrNull() ?: continue
                val timeLine = lines[1]
                val text = lines.drop(2).joinToString("\n")

                val times = parseTimeLine(timeLine) ?: continue

                subtitles.add(
                    Subtitle(
                        index = index,
                        startTimeMs = times.first,
                        endTimeMs = times.second,
                        text = text.trim()
                    )
                )
            } catch (e: Exception) {
                DebugLogger.warning("Failed to parse subtitle block: ${e.message}")
            }
        }

        return subtitles.sortedBy { it.startTimeMs }
    }

    /**
     * Parse time line in format "00:00:00,000 --> 00:00:00,000"
     */
    private fun parseTimeLine(line: String): Pair<Long, Long>? {
        val parts = line.split("-->")
        if (parts.size != 2) return null

        val startTime = parseTime(parts[0].trim()) ?: return null
        val endTime = parseTime(parts[1].trim()) ?: return null

        return Pair(startTime, endTime)
    }

    /**
     * Parse time string in format "00:00:00,000" to milliseconds
     */
    private fun parseTime(timeString: String): Long? {
        // Handle both "00:00:00,000" and "00:00:00.000" formats
        val normalized = timeString.replace(",", ".")
        val parts = normalized.split(":")

        if (parts.size != 3) return null

        return try {
            val hours = parts[0].toLong()
            val minutes = parts[1].toLong()
            val secondsParts = parts[2].split(".")
            val seconds = secondsParts[0].toLong()
            val millis = if (secondsParts.size > 1) {
                secondsParts[1].padEnd(3, '0').take(3).toLong()
            } else 0L

            (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + millis
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Get the subtitle text for a given time position
     */
    fun getSubtitleAt(subtitles: List<Subtitle>, timeMs: Long): String? {
        return subtitles.find { subtitle ->
            timeMs >= subtitle.startTimeMs && timeMs <= subtitle.endTimeMs
        }?.text
    }
}
