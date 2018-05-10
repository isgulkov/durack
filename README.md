## Requirements

- Python 2.7.9+
- Node.js 4.0.0+
- nginx 1.11.0+

## Installation

Install requirements for the server and client apps:

```
pip install -r server/requirements.txt
```

```
npm install ./client
```

Bundle the client app with `parcel`:

```
parcel build ./client/index.html
```

## Running

Serve the client files with `nginx`:

```
nginx -p . -c nginx.conf
```

Start the server:

```
python server
```
