import "reflect-metadata";
import * as minimist from 'minimist';
import { transformAndValidate } from "class-transformer-validator";
import { registerDecorator, ValidatorConstraintInterface } from "class-validator";
import * as figlet from 'figlet';

export type ArgumentDefinition = {
    name?: string;
    alias?: string;
    description?: string;
    required?: boolean;
    parse?: <T>(s: string) => T;
};

type RequiredArgumentDefinition = ArgumentDefinition & { name: string; property: string }

class ArgumentStore {
    private static store: { [key: string]: Array<RequiredArgumentDefinition> } = {}
    public static pushArgument(clazz: string, arg: RequiredArgumentDefinition): void {
        const store = ArgumentStore.store[clazz] || []
        store.push(arg)
        ArgumentStore.store[clazz] = store
    }
    public static getArguments(clazz: string): Array<RequiredArgumentDefinition> {
        return ArgumentStore.store[clazz]
    }
}

const getCommandString: (command: string, args: RequiredArgumentDefinition[]) => string = (command, args) => {
    const getArgString: (arg: RequiredArgumentDefinition) => string = (arg) => `
\t\t${!arg.required ? "[" : ""}--${arg.name} ${arg.alias ? `\t| -${arg.alias}` : ""}${!arg.required ? "]" : ""}\t<value>\t\t${arg.description || ""}`
    return args.reduce((p, n) => p + getArgString(n), `Usage: ${command} [options]
Options:`)
}

type CommandHandler<T> = (args: minimist.ParsedArgs) => Promise<T>;
type CommandDefinition<T> = {
    handle: <R>(handler: (t: T) => R | Promise<R>) => CliApp;
}
type Logger = {
    log: (_: string) => void
    error: (_: string) => void
}

export class CliApp {
    private readonly _handlers: Record<string, CommandHandler<any>>;
    private readonly _appName: string;
    private readonly _logger: Console;

    constructor(appName: string, handlers: Record<string, CommandHandler<any>> = {}, logger: Console = console) {
        this._handlers = handlers
        this._appName = appName
        this._logger = logger
    }

    command<T extends object>(name: string, t: new (...args: any[]) => T): CommandDefinition<T> {
        return {
            handle: <R>(handler: (t: T) => R | Promise<R>): CliApp => {
                const commandHandler: CommandHandler<R> = (parsed: minimist.ParsedArgs) => {
                    const argDefs = ArgumentStore.getArguments(t.name)
                    const parsedArgs = argDefs.reduce((p, n) => {
                        const arg = n.alias ? (parsed[n.alias] || parsed[n.name]) : parsed[n.name]
                        return Object.assign({}, p, { [n.property]: (n.parse || ((s): T => s as any))(arg) })
                    }, {} as { [key: string]: any })
                    return transformAndValidate<T>(t, parsedArgs)
                        .then(handler)
                        .catch(e => {
                            this._logger.log(getCommandString(name, argDefs))
                            throw e;
                        })
                }
                return new CliApp(this._appName, Object.assign({}, this._handlers, { [name]: commandHandler }))
            }
        }
    }

    run(cargs = process.argv.slice(2)): Promise<any> {
        return new Promise((resolve, reject) => {
            figlet(this._appName, "Larry 3D", (err, data) => {
                if (process.stdout.isTTY)
                    console.log(data)
                const parsed = minimist(cargs)
                const command = parsed._[0]
                const handler = this._handlers[command]
                return handler(parsed).then(resolve).catch(reject)
            })
        })
    }
}

class IsValidArgument implements ValidatorConstraintInterface {
    private readonly _argDef: RequiredArgumentDefinition;
    constructor(argDef: RequiredArgumentDefinition) {
        this._argDef = argDef
    }

    validate(value: any): boolean {
        if (this._argDef.required) {
            return !!value
        }
        return true;
    }

    defaultMessage?(): string {
        return `Parameter --${this._argDef.name} is invalid or not supplied`
    }
}

export const Argument: (args?: ArgumentDefinition) => PropertyDecorator = (args?: ArgumentDefinition) => {
    return function (target: Record<string, any>, property: string | symbol): void {
        const arg = Object.assign({}, args, { property: property.toString(), name: args.name || property })
        registerDecorator({
            target: target.constructor,
            propertyName: property.toString(),
            validator: new IsValidArgument(arg)
        })
        ArgumentStore.pushArgument(target.constructor.name, arg)
    }
}