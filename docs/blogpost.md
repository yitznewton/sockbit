# The Realtime Web with Socket.IO and RabbitMQ

*cross-posted from http://dev.imagineeasy.com/post/91224992649/the-realtime-web-with-socket-io-and-rabbitmq*

I have been thinking a lot about the best way to implement a realtime
collaborative web app. WebSockets is the maturing tech of choice for this, and
although there still seem to be some issues in terms of support, things are
improving. Internet Explorer has support as of version 10. Mobile carriers and
some institutional firewalls might implement some network-level impediments,
but [apparently it's possible to serve WebSockets over port 443 and largely
escape this
problem](http://blog.hekkers.net/2012/12/09/websockets-and-mobile-network-operators/).

WebSockets inherently offers a two-way connection between a single browser
session and the server; the broader context of what other clients might be
connected to the application (such as in a collaborative setting) is outside of
the scope of WebSockets. There are several solutions already out there for
broadcasting across sessions; the most interesting to my mind are
[Socket.IO](http://socket.io/) (node.js), [Faye](http://faye.jcoglan.com)
(node.js and Ruby), and [Autobahn](http://autobahn.ws)  (node.js, Python and
more).  I decided to use Socket.IO to begin my investigation, based on

* the high visibility of Socket.IO as per Google Trends,
* a [high-profile adoption by the Trello team](http://blog.fogcreek.com/the-trello-tech-stack/), as well as
* their fairly well-documented falling-out
* and my personal preference at first glance for its API.

**Disclaimer:** This is my first experience working with node.js, so

* don't assume I know what I'm doing, and copy-n-paste my code
* go easy :}

## Scalability

As I was proceeding with research, the one class of thing that kept popping up
in blogs, etc. was scalability issues. I was not really interested in solving
those problems within Socket.IO or figuring out if it is still an issue with
the current release; for now I'm just maintaining [a list of articles about the
topic](https://pinboard.in/u:yitznewton/t:socketio/t:scalability).

Instead, I looked for a way to incorporate Socket.IO into our stack without
putting any scaling pressure on it directly.

## Solution: use Socket.IO as a dumb transport

My experimental solution is to maintain a cluster of Socket.IO processes whose
only function is to maintain the browser connections, and shuttle messages to
and from a message queue. With this arrangement, each Socket.IO process is
independent of the others, so there is no shared backend or storage to scale.
These messages constitute both incoming job requests (e.g. "hey server, update
a particular entity"), and outgoing announcements ("hey everyone, entity 123
has been updated"). I chose [RabbitMQ](http://www.rabbitmq.com/) as the
messaging server for this experiment.

**Caveat:** I have not yet devised a testing plan to compare this architecture
with a "plain" Socket.IO setup, so I can't say whether this actually makes
anything better, only that it avoids any poor design that might have hampered
multi-process Socket.IO installations.

## Bonus: forced decoupling of application code

An extremely useful bonus involved the application code, as distinct from the
transport layer. This insight might even be worth more to me than any
Socket.IO-specific benefits.

I had been concerned, with these node.js-based server scenarios, about the idea
of implementing an application server in JavaScript. Our team's server-side
specialists (including me) don't have deep experience with node or JS in
general, and with my bias toward type safety features, I personally have
misgivings about writing complex things in JavaScript, as opposed to our usual
mode of somewhat-type-safe PHP. (I discovered that
[@vanbosse](http://twitter.com/vanbosse) utilized this same concept in [his
post dealing with a very similar application of
RabbitMQ](http://vanbosse.be/blog/detail/pub-sub-with-rabbitmq-and-websocket).)

When we treat all requests and responses as generic, context-agnostic messages,
and let the *application core* pull them off a queue and "report back" in this
generic way (as opposed to specialized ones like `HttpRequest`/`HttpResponse`),
we force ourselves to decouple the application code quite starkly from the
transport layer.

In most "MVC framework" situations like working with Rails or Symfony, the best
you can hope for is to consciously keep your code decoupled from the web
framework you're using, and that takes discipline. Here, however, our point of
departure is a "message-in, message-out" application -- pretty much perfectly
echoing the Uncle Bobbian [Clean
Architecture](http://blog.8thlight.com/uncle-bob/2012/08/13/the-clean-architecture.html).
(See also [Gary Bernhardt's
talk](https://www.destroyallsoftware.com/talks/boundaries) on boundaries for
more architecture porn.) Not only have we made ourselves implement an ideal
interface for testability, we have also freed ourselves to make open decisions
about the messaging stack, and even change our minds later. Socket.IO not
working out? Just swap in Faye, and all you need to do is write a new messaging
adapter for the Faye-RabbitMQ interface. The application itself is unchanged.

## Proof of concept: SockBit

To demonstrate this approach, I have created a [prototype note-editing
application, SockBit](https://github.com/yitznewton/sockbit).  In function, it
is sort of like an unfinished 5% of Trello. It uses this stack to allow users
to edit notes collaboratively in realtime; when one user edits a note and blurs
the input, the change is sent to the server, where it is persisted, and then
pushed up to other clients. Here's a screencast of me demonstrating it.

http://www.youtube.com/watch?v=Z8BHrZUPKI0

## Conclusion

This was a really fun exercise, and has served as a great demonstration of the
possibilities of Clean Architecture in action. The next step will be to see if
I can test the scalability of this architecture in comparison with a straight
Socket.IO version. My next stop will be checking out [PhantomJS at
scale](http://sorcery.smugmug.com/2013/12/17/using-phantomjs-at-scale/).
