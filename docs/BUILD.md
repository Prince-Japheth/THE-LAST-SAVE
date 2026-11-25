# THE LAST SAVE



## Design
Browser-local obsolete-file archaeology lab. A fictional 1996 MIRA observatory disk introduces real binary PCX, DBF, RTF and ANSI fixtures. Visitors import local files or ZIPs, inspect decoded views or original hex bytes, and export PNG/CSV/text with originals and SHA256 manifest. No invented recovery or script execution. Desktop and mobile, reduced motion, keyboard accessible.

## Decoder contract
lib/decoders.mjs exports decodeArtifact(bytes,filename) -> {kind:'image'|'table'|'document'|'terminal',format,title,era,description,metadata:[{label,value}],warnings:[],text?,table?:{columns:[],rows:[][]},image?:{width,height,rgba:Uint8ClampedArray}}. Throws Error on invalid or unsupported data. Limits8MiB and4M pixels.
lib/archive.mjs exports openArchive(bytes,name), MAX_FILE_BYTES=8MiB,MAX_TOTAL_BYTES=16MiB; returns [{name,bytes}]. ZIP stored/deflate streaming bounded chunks, validate local/central sizes/CRC and actual CRC, reject traversal,duplicate basenames, >32files,ZIP64,descriptor,encryption,multidisk unsupported.
Demo manifest {title,description,files:[{name,url,size,role}],zipUrl}.

## Current functionality
IndexedDB persistence and provenance; sound defaults on after interaction; bounded native PNG/JPEG decoding; prior-parity reconstruction and contiguous image carving; paired read-only external disk prefix companion; optional database-free Vercel VAPID functions. See README.md for demo flow and docs/VERIFICATION.md for tested versus unverified behavior. Original inputs remain unchanged; reconstructed bytes are separate derived artifacts.
