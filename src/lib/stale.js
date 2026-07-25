'use strict';

const fs = require('fs-extra');

function checkStaleness(entry) {
  const results = [];
  let entryDate = new Date(entry.date);

  // If the date is just a day (YYYY-MM-DD) without time, it was truncated to midnight.
  // Shift it to the very end of that day to prevent instant false positives for same-day edits.
  if (entry.date && !entry.date.includes('T')) {
    entryDate = new Date(entryDate.getTime() + 24 * 60 * 60 * 1000 - 1);
  } else {
    // For exact ISO times, give a 24-hour grace period so tweaks the same day don't flag as instantly stale
    entryDate = new Date(entryDate.getTime() + 24 * 60 * 60 * 1000);
  }

  for (const filepath of entry.files) {
    try {
      if (!fs.existsSync(filepath)) continue;
      const stat = fs.statSync(filepath);
      const mtime = stat.mtime;

      if (mtime > entryDate) {
        const daysAgo = Math.floor((Date.now() - mtime.getTime()) / (1000 * 60 * 60 * 24));
        results.push({ isStale: true, filepath, mtime, daysAgo });
      }
    } catch (e) {
      // Skip files that can't be stat'd
    }
  }

  return results;
}

module.exports = { checkStaleness };
