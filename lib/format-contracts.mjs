export const FORMAT_CONTRACTS={
 PCX:{supported:'8-bit indexed single-plane or 8-bit RGB three-plane PCX; bounded RLE',output:'PNG',limit:'4,194,304 pixels; 8 MiB input',unsupported:'Other bit depths and unsupported plane layouts',source:'https://www.fileformat.info/format/pcx/egff.htm'},
 BMP:{supported:'Uncompressed BITMAPINFOHEADER or newer, 8/24/32-bit',output:'PNG',limit:'4,194,304 pixels; 8 MiB input',unsupported:'RLE, bitfields and OS/2 headers',source:'https://learn.microsoft.com/en-us/windows/win32/gdi/bitmap-storage'},
 DBF:{supported:'dBASE III active records and supported scalar fields',output:'CSV',limit:'8 MiB input',unsupported:'Deleted records and memo payloads; inspect warnings',source:'https://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm'},
 RTF:{supported:'Bounded plain-text extraction with groups, escapes and Unicode fallback',output:'UTF-8 text',limit:'8 MiB input',unsupported:'Layout, styling and embedded objects',source:'https://www.microsoft.com/en-us/download/details.aspx?id=10725'},
 ANSI:{supported:'CP437 / UTF-8 text and a subset of terminal color controls',output:'UTF-8 text with CSI controls omitted',limit:'8 MiB input',unsupported:'Full cursor/terminal emulation'},
 ZIP:{supported:'Stored and deflate entries; central/local bounds and CRC verified',output:'Original file bytes',limit:'32 files; 8 MiB per file; 16 MiB expanded',unsupported:'Encryption, ZIP64, data descriptors, multidisk and unsafe paths'},
 PARITY:{supported:'Earlier capsule; one damaged/missing 4 KiB block per eight-block stripe',output:'Full SHA-256-verified bytes',limit:'App reconstruction input 8 MiB; core 16 MiB',unsupported:'Multiple corrupt blocks in one stripe, insertions and arbitrary shifts'},
 CARVING:{supported:'Contiguous structurally validated PNG/BMP/JPEG',output:'Candidate bytes with byte offsets',limit:'64 MiB raw image; session imports remain bounded',unsupported:'Filesystem undelete, fragmented files or overwritten sectors'}
};
