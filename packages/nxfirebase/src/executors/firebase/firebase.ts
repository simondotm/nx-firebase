import { ExecutorContext, offsetFromRoot } from '@nrwl/devkit'
import { FirebaseExecutorSchema } from './schema';
import { spawn } from 'child_process';
import { join } from 'path'
import { execSync } from 'child_process'

import { Observable, OperatorFunction, Subject, zip } from 'rxjs';

function runFirebaseCli(args:string[]) {
  return new Observable<{
    info?: string;
    error?: string;
    tscError?: Error;
    end?: string;
  }>((subscriber) => {

    console.log("spawning: firebase " + args.join(' '))
    let errorCount = 0;
    // Run Firebase CLI command
    const child = spawn("firebase", args, { shell: true });

    // Run command
    child.stdout.on('data', (data) => {
      const decoded = data.toString();
      // eslint-disable-next-line no-control-regex
      if (decoded.match(/\x1Bc/g)) return;
      if (decoded.includes('): error T')) {
        errorCount++;
        subscriber.next({ error: decoded });
      } else {
        subscriber.next({ info: decoded });
      }
    });
    child.stderr.on('error', (tscError) => {
      subscriber.next({ tscError });
    });
    child.stdout.on('end', () => {
      subscriber.next({
        info: `Type check complete. Found ${errorCount} errors`,
      });
    });
  });
}


export default async function runExecutor(options: FirebaseExecutorSchema, context: ExecutorContext) {
  console.log('Executor ran for Firebase', options);

  //const cwd = process.cwd()
  const projectRoot = context.root
  const firebaseConfig = options.firebaseConfig

  if (!firebaseConfig) throw Error()

  let cmd = options.cmd
  if (!cmd) throw Error()

  if (cmd[0] === '"' && cmd[cmd.length - 1] === '"') {
    cmd = cmd.substring(1).slice(0, -1);
  }  
  const config = join(projectRoot, firebaseConfig)

  console.log("projectRoot=" + projectRoot)
  console.log("firebaseConfig=" + firebaseConfig)
  console.log("cmd=" + cmd)
  console.log("config=" + config)


  // Run command
    //const command = join(projectRoot, )
    const args: string[] = cmd.split(' ')
    args.push('--config', config)


  const command = 'firebase ' + args.join(' ')
    console.log("running: " + command)
    let success = true
    // Run Firebase CLI command
    try {
        const r = execSync(command)
        const out = r.toString()
        console.log(out)
    }
    catch (err) {
        success = false
        const stdout = err.stdout.toString()
        const stderr = err.stderr.toString()
        console.error(stdout)
        console.error(stderr)
    }
    
    /*
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            success = false
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
*/

/*
    const child = spawn("firebase", args, { shell: true });
    child.stdout.on('data', (data) => {
      const decoded = data.toString();
      console.log(decoded)
    });
    child.stderr.on('error', (error) => {
      console.error(error.message)
      success = false
    });
    child.stdout.on('end', () => {
        console.log("Completed")
    });
    */
    return { success: success }

  /*
      return context.scheduleBuilder('@nrwl/workspace:run-commands', {
        cwd: frontendProjectRoot,
        parallel: false,
        commands: [
          {
            command: `firebase ${cmd} --config "${config}"`,
          },
        ],
      });
    


  return {
    success: true,
  };
  */
}
