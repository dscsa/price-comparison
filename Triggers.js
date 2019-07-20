function trigger() {
  var sheet = SpreadsheetApp.getActiveSheet()
  var names = sheet.getRange('AE2:AE').getValues()
  var dosages = sheet.getRange('AF2:AF').getValues()
  var forms = sheet.getRange('AG2:AG').getValues()
  var qtys = sheet.getRange('AH2:AH').getValues()
  
  var urls = goodrxAPI(names, dosages, forms, qtys)
  var links = lookupPrice(urls)
  
  sheet.getRange('AI2:AI').setValues(urls)
  sheet.getRange('AJ2:AL').setValues(links) 
}