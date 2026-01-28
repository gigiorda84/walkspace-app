package com.bandite.sonicwalkscape.utils

import java.io.File

data class SubtitleCue(
    val index: Int,
    val startTimeMs: Long,
    val endTimeMs: Long,
    val text: String
)

object SubtitleParser {

    fun parseSrt(content: String): List<SubtitleCue> {
        val cues = mutableListOf<SubtitleCue>()
        val blocks = content.trim().split("\n\n")

        for (block in blocks) {
            val lines = block.lines().filter { it.isNotBlank() }
            if (lines.size < 3) continue

            try {
                val index = lines[0].trim().toIntOrNull() ?: continue
                val timeLine = lines[1]
                val text = lines.drop(2).joinToString("\n")

                val times = parseTimeLine(timeLine) ?: continue
                cues.add(
                    SubtitleCue(
                        index = index,
                        startTimeMs = times.first,
                        endTimeMs = times.second,
                        text = text.trim()
                    )
                )
            } catch (e: Exception) {
                DebugLogger.e("Failed to parse subtitle block: $block", e)
            }
        }

        return cues.sortedBy { it.startTimeMs }
    }

    fun parseSrtFile(file: File): List<SubtitleCue> {
        return try {
            parseSrt(file.readText())
        } catch (e: Exception) {
            DebugLogger.e("Failed to read subtitle file: ${file.path}", e)
            emptyList()
        }
    }

    private fun parseTimeLine(line: String): Pair<Long, Long>? {
        // Format: 00:00:01,000 --> 00:00:05,000
        val regex = """(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})""".toRegex()
        val match = regex.find(line) ?: return null

        val (h1, m1, s1, ms1, h2, m2, s2, ms2) = match.destructured

        val startMs = h1.toLong() * 3600000 + m1.toLong() * 60000 + s1.toLong() * 1000 + ms1.toLong()
        val endMs = h2.toLong() * 3600000 + m2.toLong() * 60000 + s2.toLong() * 1000 + ms2.toLong()

        return startMs to endMs
    }

    fun getCurrentCue(cues: List<SubtitleCue>, currentTimeMs: Long): SubtitleCue? {
        return cues.find { cue ->
            currentTimeMs >= cue.startTimeMs && currentTimeMs <= cue.endTimeMs
        }
    }
}
