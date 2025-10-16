#!/bin/bash

# ==============================================================================
# VS Code File Watch Lister
#
# Description:
#   This script identifies all running Visual Studio Code processes and lists
#   the files and directories each process is watching via 'inotify'.
#   It provides two views:
#     1. A detailed list of watched paths, grouped by each process ID (PID).
#     2. A combined, sorted, and unique list of all paths being watched across
#        all VS Code processes.
#
# Usage:
#   ./vscode_watch_list.sh
#
# ==============================================================================

echo "🔍 Finding VS Code process IDs..."

# Get an array of PIDs for processes with 'code' in their command line
# Using an array is safer for handling PIDs with spaces or special characters.
pids=($(pgrep -f "code"))

# Check if any VS Code processes were found
if [ ${#pids[@]} -eq 0 ]; then
    echo "❌ No VS Code processes found running."
    exit 1
fi

echo "✅ Found ${#pids[@]} VS Code processes. PIDs: ${pids[*]}"
echo

# --- Section 1: List watches for each individual process ---
echo "--- Watches Grouped by Process ID (PID) ---"
for pid in "${pids[@]}"; do
    echo
    echo "--- PID: $pid ---"
    
    # List file descriptors for the current PID, filter for inotify links,
    # and clean up the output to show only the path.
    # The 2>/dev/null suppresses errors if a process terminates while the script is running.
    ls -l "/proc/$pid/fd/" 2>/dev/null | grep 'anon_inode:inotify' | sed 's/.*-> //'
done

# --- Section 2: Provide a combined, unique list of all watched paths ---
echo
echo "----------------------------------------------------"
echo "--- All Unique Watched Paths (Combined) ---"

# We run the loop inside a subshell `(...)` so that the entire output can be
# piped to the subsequent sed, sort, and uniq commands.
(for pid in "${pids[@]}"; do
    ls -l "/proc/$pid/fd/" 2>/dev/null | grep 'anon_inode:inotify'
done) | sed 's/.*-> //' | sort | uniq

echo
echo "✨ Done."
