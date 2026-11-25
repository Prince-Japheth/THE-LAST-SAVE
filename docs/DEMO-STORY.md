# MIRA / THE LAST SAVE

An original fictional demonstration. MIRA, M. Vale, the station, dates and events are invented. These files are not recovered historical evidence. No external artwork is used.

The station archivist leaves a disk on its last night. A camera image holds an auroral arc, copper observatory and north lamp. The catalog ends with an unnamed signal and seventeen pulses. The terminal reports those pulses despite a disconnected clock, then an impossible second dome. The letter asks the reader to leave the image open until morning.

Run `node scripts/generate-demo.mjs` after installing fflate. The generator deterministically authors all five files, manifest and actual ZIP. Original pixel geometry uses seed 19961024; no external art is used.

- SIGNAL.PCX: PC Paintbrush v5, 320 × 200 pixels, RLE, indexed 8-bit, one plane, 320 bytes per scanline; 0x0C palette marker and 768 RGB bytes.
- STARLOG.DBF: dBASE III 0x03, six active records, CATALOG C10, OBJECT C22, COUNT N5, OBSERVED D8, VERIFIED L1. Dates use YYYYMMDD, logical fields T/F, header terminator 0x0D, EOF 0x1A. No memo file.
- LETTER.RTF: RTF 1 ASCII, Courier New font, paragraph/bold/italic controls and explicit fiction notice.
- NIGHT.ANS: ASCII CRLF, ANSI clear/home and SGR colors, bold, dim and reset; original fictional transcript.
- README.TXT: ASCII CRLF disk instructions and fiction notice.

MIRA-LAST-SAVE.zip contains the five exact original byte streams. The manifest records byte sizes and `/demo/` URLs. preview.png is a visual preview of SIGNAL.PCX.

Format references: [PCX layout](https://www.fileformat.info/format/pcx/egff.htm), [dBASE field layout](https://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm) (fixture uses dBASE III's 32-byte descriptors), [RTF specification](https://www.microsoft.com/en-us/download/details.aspx?id=10725), [ECMA-48 controls](https://ecma-international.org/publications-and-standards/standards/ecma-48/).
