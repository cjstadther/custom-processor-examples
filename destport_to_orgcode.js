const DESTPORT_MAPPING = {
  ['PHMNN']: 'AHRTRAMNS',
  ['CATOR']: 'AMERACYTO',
  ['CAVAN']: 'AMERACYVR',
  ['GBFXT']: 'WHEEURFXT',
  ['BEANR']: 'WHEPROANR',
  ['USATL']: 'WHEPROATL',
  ['USBUN']: 'WHEPROATL',
  ['USLAX']: 'WHEPROATL',
  ['AUMEL']: 'WHEPROMEL',
  ['AUSYD']: 'WHEPROMEL',
  ['AUBNE']: 'WHEPROMEL'
}

const ORIGINPORT_MAPPING = {
  ['CNCSD']: 'HKG',
  ['CNFRT']: 'HKG',
  ['CNGUT']: 'HKG',
  ['CNCAN']: 'HKG',
  ['HKHKG']: 'HKG',
  ['CNHUA']: 'HKG',
  ['CNJMN']: 'HKG',
  ['CNNSA']: 'HKG',
  ['CNSJQ']: 'HKG',
  ['CNSUD']: 'HKG',
  ['CNYTN']: 'HKG',
  ['CNZSN']: 'HKG',
  ['CNZUH']: 'HKG',
  ['CNDCB']: 'HKG',
  ['CNSHK']: 'HKG',
  ['CNXGA']: 'HKG',
  ['CNSZX']: 'HKG',
  ['CNFUO']: 'HKG',
  ['CNNGB']: 'HKG',
  ['CNSHA']: 'HKG',
  ['CNNJG']: 'HKG',
  ['CNCHQ']: 'HKG',
  ['CNWHG']: 'HKG',
  ['CNZPU']: 'HKG',
  ['CNXMN']: 'HKG',
  ['TWTXG']: 'HKG',
  ['TWTYN']: 'HKG',
  ['MYPKG']: 'HKG',
  ['VNCMT']: 'HKG',
  ['IDJKT']: 'HKG',
  ['CNTAO']: 'CHN',
  ['CNDLC']: 'CHN',
  ['CNLYG']: 'CHN',
  ['CNTXG']: 'CHN'
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

  const portOfDischarge = xml.text(xmlDocument, '/UniversalShipment/Shipment/PortOfDischarge/Code')
  const orgCode = DESTPORT_MAPPING[lodash.trim(lodash.toUpper(portOfDischarge))]
  
  if (orgCode) {
    userLog.info('Remapping ConsigneeDocumentaryAddress OrganizationCode')
    const consigneeDocumentaryAddress  = xml.element(xmlDocument, '/UniversalShipment/Shipment/OrganizationAddressCollection/OrganizationAddress[AddressType = "ConsigneeDocumentaryAddress"]/OrganizationCode')
    userLog.info(`Port Of Discharge found: ${portOfDischarge}`)
    userLog.info(`New Consignee Organization Code mapped value: ${orgCode}`)
    consigneeDocumentaryAddress.setTextContent(orgCode)
  }

  const portOfLoading = xml.text(xmlDocument, '/UniversalShipment/Shipment/PortOfLoading/Code')
  const companyCode = ORIGINPORT_MAPPING[lodash.trim(lodash.toUpper(portOfLoading))]

  if (companyCode) {
    userLog.info('Remapping DataContext CompanyCode')
    const dataContextCompanyCode  = xml.element(xmlDocument, '/UniversalShipment/Shipment/DataContext/Company/Code')
    userLog.info(`Port Of Loading found: ${portOfLoading}`)
    userLog.info(`New CompanyCode value: ${companyCode}`)
    dataContextCompanyCode.setTextContent(companyCode)
  }

  return {
    ...file,
    body: new xml.XmlSerializer().serializeToString(xmlDocument)
  }
}

const updatedFiles = destinationFiles.map(handleFile).filter(x => x)

if (updatedFiles.length === 0) {
  returnSkipped([])
} else {
  returnSuccess(updatedFiles)
}