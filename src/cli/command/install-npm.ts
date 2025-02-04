import { Command, Option } from 'clipanion';
import prettyMilliseconds from 'pretty-ms';
import * as t from 'typanion';
import { installTool } from '../install-tool';
import { logger, validateVersion } from '../utils';
import { getVersion } from './utils';

export class InstallNpmEnvCommand extends Command {
  static override paths = [['install', 'npm']];

  static override usage = Command.Usage({
    description: 'Installs a npm package into the container.',
    examples: [
      [
        'Installs del-cli with version via environment variable',
        'DEL_CLI_VERSION=5.0.0 $0 install npm del-cli',
      ],
    ],
  });

  name = Option.String();

  dryRun = Option.Boolean('-d,--dry-run', false);

  override async execute(): Promise<number | void> {
    const version = getVersion(this.name);

    if (!version) {
      logger.fatal(`No version found for ${this.name}`);
      return 1;
    }

    return await this.cli.run([
      ...this.path,
      ...(this.dryRun ? ['-d'] : []),
      this.name,
      version,
    ]);
  }
}

export class InstallNpmCommand extends InstallNpmEnvCommand {
  static override usage = Command.Usage({
    description: 'Installs a npm package into the container.',
    examples: [['Installs del-cli 5.0.0', '$0 install npm del-cli 5.0.0']],
  });

  version = Option.String({
    required: true,
    validator: t.cascade(t.isString(), validateVersion()),
  });

  override async execute(): Promise<number | void> {
    const start = Date.now();
    let error = false;

    logger.info(`Installing npm package ${this.name} v${this.version}...`);
    try {
      return await installTool(this.name, this.version, this.dryRun, 'npm');
    } catch (err) {
      logger.fatal(err);
      error = true;
      return 1;
    } finally {
      logger.info(
        `Installed npm package ${this.name} ${
          error ? 'with errors ' : ''
        }in ${prettyMilliseconds(Date.now() - start)}.`,
      );
    }
  }
}

export class InstallNpmShortEnvCommand extends InstallNpmEnvCommand {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description: 'Installs a npm package into the container.',
    examples: [
      [
        'Installs del-cli with version via environment variable',
        'DEL_CLI_VERSION=5.0.0 $0 del-cli',
      ],
    ],
  });
}

export class InstallNpmShortCommand extends InstallNpmCommand {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description: 'Installs a npm package into the container.',
    examples: [['Installs del-cli v5.0.0', '$0 del-cli 5.0.0']],
  });
}
