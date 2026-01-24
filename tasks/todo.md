# Task: Translate Difficulty Labels

## Problem
Difficulty labels (Facile/Medio/Difficile) were showing in Italian for all users regardless of their language setting.

## Solution
Add translations to LocalizedStrings.swift and update Tour.displayDifficulty to use them.

## Changes Made

### LocalizedStrings.swift
- Added `difficultyEasy`: Easy / Facile / Facile
- Added `difficultyModerate`: Moderate / Medio / Moyen
- Added `difficultyChallenging`: Challenging / Difficile / Difficile
- Added `localizedDifficulty(_ rawValue:)` helper function

### Tour.swift
- Updated `displayDifficulty` to use `LocalizedStrings.shared.localizedDifficulty(difficultyRaw)`

## Translation Table

| Raw Value | English | Italian | French |
|-----------|---------|---------|--------|
| facile | Easy | Facile | Facile |
| medio | Moderate | Medio | Moyen |
| difficile | Challenging | Difficile | Difficile |
