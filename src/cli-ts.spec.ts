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

class PrintArgsParams {
    @Argument({
        alias: "a",
        required: true
    })
    public arg: string
}


describe("CliApp", () => {

    const testApp = new CliApp("Test CLITS")
        .command("show-person", ShowPersonParams)
        .handle(p => p)
        .command("print-args", PrintArgsParams)
        .handle(a => console.dir(a))

    it("should decorate proerty", () => {
        process.argv = "show-person -n John --age 32 --dob 2000-01-01".split(" ")
        const johnPromise = testApp.run()
        return expect(johnPromise).resolves.toMatchObject({
            name: "John",
            age: 32,
            dob: new Date(Date.parse('2000-01-01'))
        })
    })
})