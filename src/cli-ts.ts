import "reflect-metadata"
import * as minimist from 'minimist'
import { transformAndValidate } from "class-transformer-validator";
import { registerDecorator, ValidationArguments, ValidatorConstraintInterface } from "class-validator";
import * as figlet from 'figlet'

export type ArgumentDefinition = {
    name?: string,
    alias?: string,
    description?: string,
    required?: boolean,
    parse?: (s: string) => any
}

type RequiredArgumentDefinition = ArgumentDefinition & { name: string, property: string }

export const argumentMetadataKey = Symbol("Argument")
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

function getCommandString(command: string, args: RequiredArgumentDefinition[]) {
    const getArgString = (arg: RequiredArgumentDefinition) => `
\t\t${!arg.required ? "[" : ""}--${arg.name} ${arg.alias ? `\t| -${arg.alias}` : ""}${!arg.required ? "]" : ""}\t\t<value>\t\t${arg.description || ""}`
    return args.reduce((p, n) => p + getArgString(n), `Usage: ${command} [options]
Options:`)
}

const Identity = <T>(t: T) => t
type CommandHandler = (args: minimist.ParsedArgs) => Promise<any>

export class CliApp {
    private readonly _handlers: Record<string, CommandHandler>;
    _appName: string;

    constructor(appName: string, handlers: Record<string, CommandHandler> = {}) {
        this._handlers = handlers
        this._appName = appName
    }

    command<T extends object>(name: string, t: new (...args: any[]) => T) {
        const me: CliApp = this;
        return {
            handle<R>(handler: (t: T) => R | Promise<R>) {
                const commandHandler: CommandHandler = (parsed: minimist.ParsedArgs) => {
                    const argDefs = ArgumentStore.getArguments(t.name)
                    const parsedArgs = argDefs.reduce((p, n) => {
                        const arg = n.alias ? (parsed[n.alias] || parsed[n.name]) : parsed[n.name]
                        return Object.assign({}, p, { [n.property]: (n.parse || Identity)(arg) })
                    }, {} as { [key: string]: any })
                    return transformAndValidate<T>(t, parsedArgs)
                        .catch(e => {
                            console.log(getCommandString(name, argDefs))
                        })
                        .then(handler)
                }
                return new CliApp(me._appName, Object.assign({}, me._handlers, { [name]: commandHandler }))
            }
        }
    }

    run(cargs = process.argv): Promise<any> {
        return new Promise((resolve, reject) => {
            figlet(this._appName, "Larry 3D", (err, data) => {
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

    validate(value: any, args: ValidationArguments) {
        if (this._argDef.required) {
            return !!value
        }
        return true;
    }

    defaultMessage?(args?: ValidationArguments) {
        return `Parameter --`
    }
}

export const Argument: (args?: ArgumentDefinition) => PropertyDecorator = (args?: ArgumentDefinition) => {
    return function (target: Object, property: string | Symbol) {
        const arg = Object.assign({}, args, { property: property.toString(), name: args.name || property })
        registerDecorator({
            target: target.constructor,
            propertyName: property.toString(),
            validator: new IsValidArgument(arg)
        })
        ArgumentStore.pushArgument(target.constructor.name, arg)
    }
}