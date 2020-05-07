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
        description: "Your card number"
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
        description: "Card expiry"
    })
    @Type(() => Date)
    public expiry: Date
}

const makeDatMoney = new CliApp("My CLI App")
    .command("get-paid", CardDeets)
    .handle(cardDeets => myRetirement.bitchPayMe(cardDeets))
    .run()
```

Then...
```bash
$> tsc
$> chmod +x ./dist/index.js
$> ./dist/index.js get-paid \
        --cardNumber 1234-5678-1234-1111 \  
        --cardName "John Smith" \
        -e "2025-01-01"

```
