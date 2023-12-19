const isMatch = (input, regex) => {
  const regExp = new RegExp(regex)
  return regExp.test(input)
}

const handleFile = (file) => {
  // get the body
  const source = file.body
  // parse the xml - by default parseFromString will remove namespaces.
  // If you're simply extracting data, then this is ok, however if you're. 
  // modifying an xml document in place, you typically do not want to remove namespaces.
  let xmlDocument
  try {
    xmlDocument = xml.XmlParser.parseFromString(source, { strip_namespace: false })
  } catch (err) {
    userLog.warning(`Skipping invalid xml file ${file.file_name}.`)
    return
  }

  const files = xml.elements(xmlDocument, '/UniversalEvent/Event/AttachedDocumentCollection/AttachedDocument')

  const datatags = files.reduce((accum, file) => {
    const filename = xml.text(file, './FileName')
    if (isMatch(filename, /C\d+/ )) {
      accum.push({
        label: 'CW Consolidation Number',
        value: filename.match(/C\d+/)[0]
      })
    }
    if (isMatch(filename, /S\d+/ )) {
      accum.push({
        label: 'CW1 Shipment Number',
        value: filename.match(/S\d+/)[0]
      })
    }

    const bookingRef = filename.match(/\](.+)/)[1]
    accum.push({
      label: 'Booking Ref',
      value: bookingRef
    })

    return accum
  }, [])
 
  userLog.info(`Processing ${JSON.stringify(datatags)}`)
  publishDataTags(datatags)
}

userLog.info('Beginning additional data-tagging')

sourceFiles.map(handleFile).filter(x => x)

returnSuccess(sourceFiles)
