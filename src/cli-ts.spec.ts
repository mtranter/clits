import { Argument, CliApp } from './cli-ts';
import { Type } from 'class-transformer';

class ShowPersonParams {
    @Argument({
        alias: "n",
        required: true,
        description: "The person's name"
    })
    public name: string

    @Argument({
        alias: "a"
    })
    public age: number

    @Argument({
        alias: "d"
    })
    @Type(() => Date)
    public dob: Date
}

class FetchPersonParams {
    @Argument({
        alias: "p",
        required: true
    })
    public personId: number
}


describe("CliApp", () => {

    const myProgram = {
        showPerson: (console: {log: (s: String) => void}) => (p: ShowPersonParams): void => {
            const msg = `Name: ${p.name}, age: ${p.age}, dob: ${p.dob}`
            console.log(msg)
        }
    }

    const testApp = new CliApp("Test CLITS")
        .command("show-person", ShowPersonParams)
        .handle(p => p)
        .command("fetch-person", FetchPersonParams)
        .handle(a => console.dir(a))

    it("should decorate proerty", () => {
        const args = "show-person -n John --age 32 --dob 2000-01-01".split(" ")
        const johnPromise = testApp.run(args)
        return expect(johnPromise).resolves.toMatchObject({
            name: "John",
            age: 32,
            dob: new Date(Date.parse('2000-01-01'))
        })
    })
    it("Should return error on required argument not supplied", async () => {
        class Required {
            @Argument({
                required: true
            })
            requireMe: boolean
        }
        const logErr = jest.fn()
        new CliApp("test")
            .command("sommat", Required)
            .handle(logErr)
            .run(["sommat"])
        expect(logErr).not.toHaveBeenCalled()
    })
})