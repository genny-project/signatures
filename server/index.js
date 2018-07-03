const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const text2png = require( 'text2png' );
const atob = require( 'atob' );
const cors = require( 'cors' );
const AWS = require( 'aws-sdk' );
const s3 = new AWS.S3();
const uuid = require( 'uuid/v4' );

const app = express();
app.use( bodyParser.json());
app.use( cors());


app.get( '/', ( req, res ) => {
  res.json({
    name: 'signatures',
    description: 'Signature microservice for Genny',
    version: process.env.VERSION || 'unknown'
  });
});

app.post( '/signature', async ( req, res ) => {
  /* Check that a request body was provided */
  if ( !req.body ) {
    res.status( 400 );
    res.json({ error: 'A valid request body must be provided' });
    return;
  }

  /* The request body was provided. Check that type and data were provided */
  const { type, data } = req.body.signature || req.body;

  if ( !type ) {
    res.status( 400 );
    res.json({ error: 'A valid type (either text or draw) must be provided' });
    return;
  }

  if ( !data ) {
    res.status( 400 );
    res.json({ error: 'A valid data string must be provided. This will either be a normal alphanumeric string for text type signatures and a base64 image for draw type signatures' });
    return;
  }

  /* Check that the type provided is valid */
  if ( type != 'text' && type != 'draw' ) {
    res.status( 400 );
    res.json({ error: 'The signature type provided is not valid. Valid values are `text` and `draw`' });
    return;
  }

  /* Render the signature */
  if ( type == 'text' ) {
    const image = await renderText( data );

    /* Upload the image to S3 */
    uploadToS3( image, ( err, file ) => {
      if ( err ) {
        res.status( 500 );
        res.json( err );
        return;
      }

      res.json({ signatureURL: file });
    });
    return;
  }

  if ( type == 'draw' ) {
    const image = await renderDraw( data );

    /* Upload the image to S3 */
    uploadToS3( image, ( err, file ) => {
      if ( err ) {
        res.status( 500 );
        res.json( err );
        return;
      }

      res.json({ signatureURL: file });
    });
    return;
  }
});

const LISTEN_PORT = process.env.PORT || 7446;

app.listen( LISTEN_PORT, () => {
  console.log( `Signatures microservice listening on ${LISTEN_PORT}` );
});

/* Renders text to a image in a signature like cursive font */
const renderText = async ( data ) => {
  return text2png( data, {
    localFontName: 'Yellowtail-Regular',
    localFontPath: '/usr/src/app/Yellowtail-Regular.ttf',
    font: '128px Yellowtail-Regular',
    padding: 20,
    lineSpacing: 10,
  });
}

const renderDraw = async ( data ) => {
  const image = dataURItoBlob( data );
  return image;
}

function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  return Buffer.from( ia );
}

const S3_BUCKET = process.env.S3_BUCKET;

const uploadToS3 = ( object, callback ) => {
  /* Generate a new name */
  const name = `signature-${uuid()}.png`;
  s3.putObject({
    Bucket: S3_BUCKET,
    Key: name,
    Body: object,
    ContentType: 'image/png'
  }, ( err, data ) => {
    if ( err ) {
      console.log( err );
      callback({ err: 'An error occured saving this signature.' });
    } else {
      callback( null, `https://s3-ap-southeast-2.amazonaws.com/${S3_BUCKET}/${name}` );
    }
  });
}
