const socketIO = require( 'socket.io' );
const debug = require( 'debug' );
const { signIn, db } = require( './firebase' );
const ioDebug = debug( 'io' );
const socketDebug = debug( 'socket' );

function setupSocketServer( server ) {
	const roomKeys = {};

	const io = socketIO( server, {
		handlePreflightRequest( req, res ) {
			const headers = {
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Allow-Origin': req.header
					? req.header.origin
					: '*',
				'Access-Control-Allow-Credentials': true,
			};
			res.writeHead( 200, headers );
			res.end();
		},
	} );

	io.on( 'connection', ( socket ) => {
		ioDebug( 'connection established!' );
		io.to( `${ socket.id }` ).emit( 'init-room' );
		socket.on( 'join-room', async ( roomID ) => {
			socketDebug( `${ socket.id } has joined ${ roomID }` );
			socket.join( roomID );
			if ( io.sockets.adapter.rooms[ roomID ].length <= 1 ) {
				io.to( `${ socket.id }` ).emit( 'first-in-room' );
				await signIn();
				const snapshot = await db
					.collection( 'posts' )
					.doc( roomID )
					.get();
				roomKeys[ roomID ] = snapshot.data().ownerKey;
			} else {
				socket.broadcast.to( roomID ).emit( 'new-user', socket.id );
			}
			io.in( roomID ).emit(
				'room-user-change',
				Object.keys( io.sockets.adapter.rooms[ roomID ].sockets )
			);
		} );

		socket.on( 'server-broadcast', async ( roomID, data ) => {
			socketDebug( `${ socket.id } sends update to ${ roomID }` );
			if ( roomKeys[ roomID ] !== data.ownerKey ) {
				return;
			}
			socket.broadcast
				.to( roomID )
				.emit( 'client-broadcast', data.action, socket.id );
		} );

		socket.on( 'server-volatile-broadcast', async ( roomID, data ) => {
			socketDebug(
				`${ socket.id } sends volatile update to ${ roomID }`
			);
			if ( roomKeys[ roomID ] !== data.ownerKey ) {
				return;
			}
			socket.volatile.broadcast
				.to( roomID )
				.emit( 'client-broadcast', data.action, socket.id );
		} );

		socket.on( 'disconnecting', () => {
			const rooms = io.sockets.adapter.rooms;
			for ( const roomID in socket.rooms ) {
				const clients = Object.keys( rooms[ roomID ].sockets ).filter(
					( id ) => id !== socket.id
				);
				if ( clients.length > 0 ) {
					socket.broadcast
						.to( roomID )
						.emit( 'room-user-change', clients );
				} else {
					roomKeys[ roomID ] = undefined;
				}
			}
		} );

		socket.on( 'disconnect', () => {
			socket.removeAllListeners();
		} );
	} );
}

module.exports = {
	setupSocketServer,
};
