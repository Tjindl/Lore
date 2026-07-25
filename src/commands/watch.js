'use strict';

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { requireInit } = require('../lib/guard');
const { LORE_DIR } = require('../lib/index');

const pidFile = () => path.join(LORE_DIR, 'watcher.pid');
const logFile = () => path.join(LORE_DIR, 'watcher.log');

function watch(options) {
  requireInit();

  // Stop daemon
  if (options.stop) {
    const pf = pidFile();
    if (!fs.existsSync(pf)) {
      console.log(chalk.yellow('No watcher running'));
      return;
    }
    const pid = parseInt(fs.readFileSync(pf, 'utf8').trim(), 10);
    if (isNaN(pid) || pid <= 0) {
      console.log(chalk.yellow('Invalid PID file — cleaning up'));
      fs.removeSync(pf);
      return;
    }

    // Check if the process is alive before attempting to kill
    let isAlive = false;
    try {
      process.kill(pid, 0); // Signal 0 = existence check only
      isAlive = true;
    } catch (e) {
      // ESRCH = no such process (stale PID file)
      // EPERM = process exists but we can't signal it (PID reuse by another user's process)
      if (e.code === 'EPERM') {
        console.log(
          chalk.yellow(
            `⚠ PID ${pid} exists but belongs to another process (permission denied) — cleaning up stale PID file`
          )
        );
      } else {
        console.log(
          chalk.yellow(`Watcher process not found (PID ${pid}) — cleaning up stale PID file`)
        );
      }
      fs.removeSync(pf);
      return;
    }

    if (isAlive) {
      try {
        process.kill(pid, 'SIGTERM');
        fs.removeSync(pf);
        console.log(chalk.green(`✓ Stopped watcher (PID ${pid})`));
      } catch (e) {
        if (e.code === 'EPERM') {
          console.error(chalk.red(`Failed to stop watcher (PID ${pid}): permission denied`));
        } else {
          console.log(chalk.yellow(`Watcher process not found (PID ${pid}) — cleaning up`));
          fs.removeSync(pf);
        }
      }
    }
    return;
  }

  // Internal worker mode (spawned as detached child)
  if (options.daemonWorker) {
    const { startWatcher } = require('../watcher/index');
    startWatcher({ quiet: true, logFile: logFile() });
    return;
  }

  // Daemon mode: spawn detached child
  if (options.daemon) {
    const { spawn } = require('child_process');
    const lf = logFile();
    fs.ensureFileSync(lf);
    const logFd = fs.openSync(lf, 'a');

    const child = spawn(process.execPath, [process.argv[1], 'watch', '--daemon-worker'], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
    });
    child.unref();
    fs.closeSync(logFd);

    fs.writeFileSync(pidFile(), String(child.pid));
    console.log(chalk.green(`✓ Lore watcher started (PID ${child.pid})`));
    console.log(chalk.dim(`   Logging to: ${lf}`));
    console.log(chalk.dim('   Stop with: lore watch --stop'));
    return;
  }

  // Foreground mode
  const { startWatcher } = require('../watcher/index');
  startWatcher({});
}

module.exports = watch;
