#!/usr/bin/env node

/**
 * GPS Walking Tour Simulator
 * Tests the GPS trigger logic for sequential point activation
 */

// Calculate distance between two GPS coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Simulate walking to each GPS point
async function simulateWalk() {
  const TOUR_ID = '8af0da02-05fa-492b-8832-bcf313034db0';
  const LANGUAGE = 'it';
  const BASE_URL = 'http://localhost:3000';

  console.log('🚶 GPS Walking Tour Simulator\n');
  console.log(`Tour ID: ${TOUR_ID}`);
  console.log(`Language: ${LANGUAGE}\n`);

  // Fetch GPS points
  const response = await fetch(`${BASE_URL}/tours/${TOUR_ID}/points?language=${LANGUAGE}`);

  if (!response.ok) {
    console.error('❌ Failed to fetch tour points:', response.status);
    return;
  }

  const points = await response.json();
  console.log(`📍 Found ${points.length} GPS points\n`);

  // Display all points
  points.forEach((point, index) => {
    console.log(`Point ${point.order}: ${point.title}`);
    console.log(`  Location: ${point.location.lat}, ${point.location.lng}`);
    console.log(`  Trigger radius: ${point.triggerRadiusMeters}m`);
    console.log(`  Description: ${point.description || '(none)'}\n`);
  });

  // Simulate user positions
  console.log('🗺️  Simulating user walk through points...\n');

  let currentPointIndex = 0;
  const userPositions = [
    // User at point 1
    { lat: 44.93447354618348, lng: 6.740316381807418, label: 'At Point 1' },
    // User between point 1 and 2
    { lat: 44.92900, lng: 6.755, label: 'Between Point 1 & 2' },
    // User at point 2
    { lat: 44.92317292205092, lng: 6.770244531079186, label: 'At Point 2' },
    // User tries to skip to point 4 (should not trigger)
    { lat: 44.92975675008142, lng: 6.75320061676328, label: 'At Point 4 (out of order)' },
    // User at point 3
    { lat: 44.91469599489412, lng: 6.772239741031001, label: 'At Point 3' },
    // User at point 4
    { lat: 44.92975675008142, lng: 6.75320061676328, label: 'At Point 4 (in order)' },
    // User at point 5
    { lat: 44.92554930377977, lng: 6.762011067788592, label: 'At Point 5' },
  ];

  for (const userPos of userPositions) {
    console.log(`\n📍 User position: ${userPos.label}`);
    console.log(`   Coordinates: ${userPos.lat}, ${userPos.lng}`);

    // Check distance to next expected point
    const nextPoint = points[currentPointIndex];

    if (nextPoint) {
      const distance = calculateDistance(
        userPos.lat,
        userPos.lng,
        nextPoint.location.lat,
        nextPoint.location.lng
      );

      console.log(`   Distance to Point ${nextPoint.order} (${nextPoint.title}): ${Math.round(distance)}m`);

      if (distance <= nextPoint.triggerRadiusMeters) {
        console.log(`   ✅ TRIGGERED Point ${nextPoint.order}!`);
        console.log(`   🎵 Playing audio for: ${nextPoint.title}`);
        currentPointIndex++;
      } else {
        console.log(`   ⏸️  Not within trigger radius (${nextPoint.triggerRadiusMeters}m)`);
      }

      // Check if user is at future point (but shouldn't trigger)
      for (let i = currentPointIndex + 1; i < points.length; i++) {
        const futurePoint = points[i];
        const futureDistance = calculateDistance(
          userPos.lat,
          userPos.lng,
          futurePoint.location.lat,
          futurePoint.location.lng
        );

        if (futureDistance <= futurePoint.triggerRadiusMeters) {
          console.log(`   ⚠️  Within range of Point ${futurePoint.order}, but out of sequence (ignored)`);
        }
      }
    } else {
      console.log(`   🎉 Tour completed! All points triggered.`);
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   Points triggered: ${currentPointIndex}/${points.length}`);
  console.log(`   Tour ${currentPointIndex === points.length ? 'COMPLETED ✅' : 'IN PROGRESS ⏳'}`);
}

// Run the simulation
simulateWalk().catch(console.error);
