# crdt-map-synchronizer

A synchronizer for a CRDT Map.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
  - [createCRDTMapSynchronizer](#createcrdtmapsynchronizer)
- [Building](#building)
- [Testing](#testing)
- [Improvements](#improvements)

## Install

```
npm i @organicdesign/crdt-map-synchronizer
```

## Usage

```javascript
import { createCRDTMapSynchronizer } from "@organicdesign/crdt-map-synchronizer";

createCRDTMap({
	synchronizers: [createCRDTMapSynchronizer(options)]
});
```

## API

### createCRDTMapSynchronizer

```javascript
createCRDTMapSynchronizer([options])(components);
```

- `options` `<Object>` An optional object with the following properties:
  - `protocol` `<string>` Specifies the name of the protocol to sync crdts over. Default: `"/stateless-crdt-map/0.1.0"`.
- `components` `<Object>` An object with the following protperties:
  - `keys` `<() => Iterable<string>>` A function that gets the list of keys.
  - `get` `<(key: string) => CRDT>` A function that gets a CRDT by key.
  - `getId` `<() => Uint8Array>` A function that returns the CRDT ID.
- Returns: `<CRDTMapSynchronizer>` The CRDT map synchronizer instance.

Creates a CRDT map synchronizer.

## Building

To build the project files run:

```sh
npm run build:protos && npm run build
```

## Testing

To run the tests:

```sh
npm run test
```

To lint files:

```sh
npm run lint
```

## Improvements

There are a number of things that could improve this synchronizer to increase it's efficiency:

* [ ] Make it stateful - holding a little bit of state reduces the size of the data needed to be sent through the channel.
* [ ] Parallel - running the requests in parallel instead of series would reduce round trips needed to synchronize it.
* [ ] Keep track of accepted crdt/protocol matches - if we know a peer has accepted a crdt/protocol pair then it is likely that it would accept it again.

Other things that need to be done:

* [ ] Testing.
* [ ] Better error handling.
