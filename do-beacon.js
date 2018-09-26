#! /usr/bin/env node

const fs = require('fs')
const fetch = require('node-fetch')

function getPublicIp () {
  return fetch('http://ifconfig.co/json').then(res => res.json()).then(res => res.ip)
}

function getConfig (file = `${process.env.SNAP_COMMON}/config.json`) {
  let config = JSON.parse(fs.readFileSync(file, 'utf-8'))
  if (config.key) {
    return config
  } else {
    config.key = process.env.DO_API_KEY
    return config
  }
}

function getRecordId (domain, name, key) {
  let doUrl = `https://api.digitalocean.com/v2/domains/${domain}/records`
  return fetch(doUrl, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` } })
    .then(res => res.json())
    .then(data => data.domain_records.find(d => d.name === name).id)
}

function setRecord (domain, key, ip, id) {
  let doUrl = `https://api.digitalocean.com/v2/domains/${domain}/records`
  let options = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ 'data': ip })
  }
  fetch(`${doUrl}/${id.toString()}`, options).then(res => res.json()).then(res => console.log(res))
}

(async function (cfg) {
  setRecord(cfg.domain, cfg.key, await getPublicIp(), await getRecordId(cfg.domain, cfg.name, cfg.key))
})(getConfig(process.argv[2]))
