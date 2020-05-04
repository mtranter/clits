# CLITS

_**C**ommand **L**ine **I**nterface app builder for **T**ype**S**cript._

Get your mind out of the gutter.

Strong typing for your CLI apps.

Validation using class-validator and class-transformer

## Usage

> index.ts
```typescript
#!/usr/bin/env node

import { CliApp } from 'clits'
import { Type } from 'class-transformer';
import { IsCreditCard } from 'class-validator'
import { MySideProject } from './side-project'

const myRetirement = new MySideProject();
class CardDeets {
    @Argument({
        alias: "c",
        required: true,
        description: "The person's name"
    })
    @IsCreditCard()
    public cardNumber: string

    @Argument({
        alias: "n",
        required: true,
        description: "The name on your card"
    })
    public cardName: string

    @Argument({
        alias: "e",
        required: true,
        description: "The name on your card"
    })
    @Type(() => Date)
    public expiry: Date
}

const makeDatMoney = new CliApp("My CLI App")
    .command("get-paid", CardDeets)
    .handle(cardDeets => myRetirement.bitchPayMe(cardDeets))

```

Then...
```bash
$> tsc
$> ./dist/index.js get-paid \
        --cardNumber 1234-5678-1234-1111 \  
        --cardName "John Smith" \
        -e "2025-01-01"

```