# tunnel.now

Zeit's [now](https://zeit.co/now) platform is fantastic for rapid iteration on Node.js projects.  But sometimes - when debugging a webhook, for example - you might want to run your project on your development machine, somehow handling the requests from there.

Of course, you _could_ make changes, deploy to `now`, and update the alias as you go.  However, this project provides an alternative for those times when you want a faster iteration cycle before deploying a final version to the cloud: it tunnels HTTP requests that are sent to `now` to your local dev machine.

## Quick start

**Step 1: Install**

```
$ npm install -g tunnel.now
```

**Step 2: Update npm links (optional)**

This step is only necessary for users of [nodenv](https://github.com/nodenv/nodenv).

```
$ nodenv rehash
```

**Step 3: Deploy your tunnel endpoint**

```
$ tunnel.deploy

  _                                _
 | |_   _  _   _ _    _ _    ___  | |      _ _    ___  __ __ __
 |  _| | || | | ' \  | ' \  / -_) | |  _  | ' \  / _ \ \ V  V /
  \__|  \_,_| |_||_| |_||_| \___| |_| (_) |_||_| \___/  \_/\_/

✔ Deployed tunnel.now instance on tunnelnow-xrjajpfyyl.now.sh

  Tunnel Usage:
   `tunnel.now tunnelnow-xrjajpfyyl.now.sh <local-port>`

```

You can also alias directly at this step, like so:

```
$ tunnel.deploy my-alias.now.sh

  _                                _
 | |_   _  _   _ _    _ _    ___  | |      _ _    ___  __ __ __
 |  _| | || | | ' \  | ' \  / -_) | |  _  | ' \  / _ \ \ V  V /
  \__|  \_,_| |_||_| |_||_| \___| |_| (_) |_||_| \___/  \_/\_/

✔ Deployed tunnel.now instance on tunnelnow-xrjajpfyyl.now.sh
✔ Pointing my-alias.now.sh to tunnelnow-xrjajpfyyl.now.sh

  Tunnel Usage:
   `tunnel.now my-alias.now.sh <local-port>`

```

As well as adding security through a token:

```
$ tunnel.deploy --token Tu0IH5IVwv5k

  _                                _
 | |_   _  _   _ _    _ _    ___  | |      _ _    ___  __ __ __
 |  _| | || | | ' \  | ' \  / -_) | |  _  | ' \  / _ \ \ V  V /
  \__|  \_,_| |_||_| |_||_| \___| |_| (_) |_||_| \___/  \_/\_/

✔ Deployed tunnel.now instance on tunnelnow-xrjajpfyyl.now.sh
✔ Pointing my-alias.now.sh to tunnelnow-xrjajpfyyl.now.sh

  Tunnel Usage:
   `tunnel.now tunnelnow-xrjajpfyyl.now.sh <local-port> --token Tu0IH5IVwv5k`

```


Note that this deployment can be re-used however many times you'd like.

**Step 4: Start your application server**

In your project, do whatever you need to do to start your server, and take note of the port that is opened:

```
$ npm run start
Listening on port 8080...
```

In this case, that's port `8080`.

**Step 5: In a separate terminal, start your tunnel**

`tunnel.now` takes three arguments:

1. The `now` hostname.  This will be either the hostname that `now` provided to you, or the alias that you specified during step 3.  That's `my-alias.now.sh` in the example above.
2. The port one which your locally-running application is listening. That's `8080` in the example above.
3. The `token` argument, which is only required if you specified one during step 3.

```
$ tunnel.now my-alias.now.sh 8080 --token Tu0IH5IVwv5k

  _                                _
 | |_   _  _   _ _    _ _    ___  | |      _ _    ___  __ __ __
 |  _| | || | | ' \  | ' \  / -_) | |  _  | ' \  / _ \ \ V  V /
  \__|  \_,_| |_||_| |_||_| \___| |_| (_) |_||_| \___/  \_/\_/

✔ Connected to wss://my-alias.now.sh:443
ℹ Tunneling requests to http://localhost:8080

```

**Step 6: Open your browser!**

Any HTTP requests made to the `now` hostname or alias will be tunneled to your local machine.

## Module API

You can also open a tunnel connection through `require('@rexlabs/tunnel.now')`.

```js
const TunnelNow = require('@rexlabs/tunnel.now')

const tunnelSocket = TunnelNow({
  remoteHostname: 'my-alias.now.sh',
  localPort: '8080',
  token: 'Tu0IH5IVwv5k'
})

tunnelSocket.addEventListener('open', () => {
  console.log('Connected!')
})
```

## FAQ

**Does this work with other services?**  
Yes.  The only hard requirement is that the host provides HTTP and WebSocket support.  However, you will need to deploy the `tunnel.now` repo yourself.


## License

This project is covered under the MIT License.  Please see the [LICENSE](./LICENSE) file for more information.
