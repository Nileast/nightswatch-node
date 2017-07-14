'use strict';

function sshExec(conn, cmd) {
  let stdout = '';
  let stderr = '';
  return new Promise (function (resolve, reject) {
    conn.exec(cmd, function(err, stream) {
      if (err) return reject(new Error(err));

      stream
        .on('close', function(code, signal) {
          if (stderr) return reject(new Error(stderr));
          return resolve(stdout);
        })
        .on('data', function(res) {
          stdout += res;
        })
        .stderr.on('data', function(data) {
          stderr += data;
        });
    });
  })
}

module.exports = {
  sshExec
};