var cache = CacheService.getScriptCache();


function goodrxAPI(name, dosage, form, qty) {
  
  if ( ! name.map && ! dosage.map && ! form.map && ! qty.map)
    return _goodrxAPI(name, dosage, form, qty)
  
  var results = []
  for (var i in name) {
    var result = _goodrxAPI(name[i][0], dosage[i][0], form[i][0], qty[i][0])
    if (result) {
      //console.log('goodrxAPI', 'name', name[i], 'dosage', dosage[i], 'form', form[i], 'qty', qty[i])
      //console.log('goodrxAPI', 'result', [result])
    }
    results.push([result])
  }
  console.log('goodrxAPI', 'results', results)
  return results
}

function _goodrxAPI(name, dosage, form, qty) {
  
  if ( ! name || ! dosage || ! qty) return ''
      
  var cacheKey = name+dosage+form+qty
  var cached   = cache.get(cacheKey)
  if (cached) return cached
  
  qty = qty || 135
  var qs  = 'name='+name.replace(/ /g, '%20')+'&dosage='+dosage+'&quantity='+qty+'&api_key='+API_KEY
  if (form) qs += '&form='+form
  var sig = createSig(qs, API_SECRET)
  
  var url = 'https://api.goodrx.com/compare-price?'+qs+'&sig='+sig
  
  cache.put(cacheKey, url, Math.random()*6*60*60) //Max Time Allowed
  
  return url
}

function test() {
  var url = goodrxAPI('gabapentin', '100mg')
  Logger.log(url)
  var price = lookupPrice(url)
  Logger.log(price)
}

//https://communities.logicmonitor.com/topic/1141-google-apps-script-to-logicmonitor-rest-api/
function createSig(message, secret) {
  
  var signature = Utilities.computeHmacSha256Signature(message, secret, Utilities.Charset.UTF_8);
  
  return Utilities.base64Encode(signature).replace(/\/|\+/g, '_')
}


function lookupPrice(url) {
  
  //console.log('lookupPrice', 'url', url)
  
  if ( ! url.map)
    return _lookupPrice(url)
  
  var results = []
  for (var i in url) {
    var result = _lookupPrice(url[i][0]).concat(['','']).slice(0,3) //Each row much be EXACTLY three cols or Range.SetValues() will throw errors
    if (result) {
      //console.log('lookupPrice', 'url', url[i])
      //console.log('lookupPrice', 'result', result)
    }
    results.push(result)
  }
  
  console.log('lookupPrice', 'results', results)
  return results
}

function _lookupPrice(url) {
  
  if ( ! url) return ['']
    
  var cached = cache.get(url)
  if (cached) {
    var pharmacies = JSON.parse(cached)
  } else {
    
    try {
   
      var res = UrlFetchApp.fetch(url, {muteHttpExceptions:true})    
      var parsed = JSON.parse(res.getContentText())
      
      if (parsed.errors && parsed.errors[0] && parsed.errors[0].candidates) {
        var matches = url.match(/dosage=(.+?)&quantity=(.+?)&/)
        url = _goodrxAPI(parsed.errors[0].candidates[0], matches[1], null, matches[2])
        res = UrlFetchApp.fetch(url, {muteHttpExceptions:true})    
        parsed = JSON.parse(res.getContentText())
      }
      
      //Logger.log(JSON.stringify(parsed.data))
      var urls = parsed.data.price_detail.url
      var prices = parsed.data.price_detail.price
      var pharmacies = parsed.data.price_detail.pharmacy.map(function(pharmacy, i) {
        
        var pharmacyPrice = pharmacy.split(' ')[0]+' $'+prices[i]
        
        if (urls[i])
          pharmacyPrice = '<a href="'+urls[i]+'" target="_blank">'+pharmacyPrice+'</a>'
          
          //Logger.log(pharmacyPrice)
          return pharmacyPrice
      })
      
      cache.put(url, JSON.stringify(pharmacies), Math.random()*6*60*60) //Randomly wait from 0 to 6 hours (max allowed) so not everything refreshes at once

    } catch (e) {
      console.log('GoodRx Error', url, parsed, e)
      return ['GoodRx Error', e.message, JSON.stringify(parsed)]
    }  
  }
   
  if (pharmacies.length != 3 || pharmacies[0] == null || pharmacies[1] == null || pharmacies[3] == null)
    console.log('_lookupPrice Error', url, pharmacies)
    
  return pharmacies
}
