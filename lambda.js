const aws = require('aws-sdk')
const dynamoDB = new aws.DynamoDB({region: 'us-east-2', apiVersion: '2012-08-10'})

const getMember = (email) => {
  const params = {
    Key: {
      "email": {
        S: email
      }
    },
    TableName: 'EmailCampaigns-ASPG'
  }
  return new Promise ((resolve, reject) => {
    dynamoDB.getItem(params, function(err, data){
      if(err) return reject(err)
        resolve(data)
    })
 })
}

const updateMemberStatus = (email, active) => {
  const params = {
    Key: {
        "email": {
            S: email
        }
    },
    UpdateExpression: 'SET active = :activeValue',
    ExpressionAttributeValues: {':activeValue': {'BOOL': active}},
    TableName: 'EmailCampaigns-ASPG'
  }
  return new Promise ((resolve, reject) => {
    dynamoDB.updateItem(params, function(err, data){
      if(err) return reject(err)
        resolve(true)
    })
  })
}

const updateMemberEmail = (oldEmail, newEmail) => {
    const params = {
      Key: {
          "email": {
              S: oldEmail
          }
      },
      UpdateExpression: 'SET email = :newEmailValue',
      ExpressionAttributeValues: {':newEmailValue': {'S': newEmail}},
      TableName: 'EmailCampaigns-ASPG'
    }
    return new Promise ((resolve, reject) => {
      dynamoDB.updateItem(params, function(err, data){
        if(err) return reject(err)
          resolve(true)
      })
    })
  }

const addNewMember = (email) => {
  const params = {
    Item: {
      "email": {
        S: email
      },
        "active": {
        BOOL: true
      }
    },
    TableName: 'EmailCampaigns-ASPG'
  }
  return new Promise ((resolve, reject) => {
    dynamoDB.putItem(params, function(err, data){
      if(err) return reject(err)
        resolve(true)
    })
  })
}


exports.handler = async(event, context, callback) => {
  try{
    if(event.type==='SUBSCRIBE' && event.email){
      const item = await getMember(event.email)
      if(item && item.Item && item.Item.active && item.Item.active.BOOL){
        return `Email ${event.email} is already subscribed`
    }else if(item && item.Item && item.Item.active && item.Item.active.BOOL===false){
      if(await updateMemberStatus(event.email, true)){
        return `Subscription on email ${event.email} was succesfully re-actived.`
      }
      return `An error ocurred while subscribing email ${event.email}. Please try again later.`
    }
    if(await addNewMember(event.email)){
      return `Email ${event.email} was succesfully subscribed`
    }
    return `An error ocurred while subscribing email ${event.email}. Please try again later`
    }else if(event.type === 'UNSUBSCRIBE' && event.email){
      const item = await getMember(event.email) 
      if(item && item.Item && item.Item.active && item.Item.active.BOOL){
        if(await updateMemberStatus(event.email, false)){
          return `Email ${event.email} was succesfully unsubscribed.`
        }
      }else if(item && item.Item && item.Item.active && item.Item.active.BOOL===false){
        return `Email ${event.email} is already unsubscribed`
      }
      return `Email ${event.email} not found in subscription list`
    }else if(event.type==='UPDATE_EMAIL' && event.oldEmail && event.newEmail){
      const item1 = await getMember(event.oldEmail) 
      const item2 = await getMember(event.newEmail)
      if(item1 && item1.Item && item1.Item.active && item1.Item.active.BOOL){
        if(item2 && item2.Item && item2.Item.active && item2.Item.active.BOOL){
          return `Email ${event.oldEmail} can't be updated. ${event.newEmail} already exist in the subscription list. Please try with different email.`
        }
        return `Subscription with email ${event.oldEmail} was succesfully updated with ${event.newEmail}.`
      }else if(item && item.Item && item.Item.active && item.Item.active.BOOL===false){
        return `Email ${event.email} is unsubscribed.`
      }
      return `Email ${event.email} not found in subscription list`
    }
    return 'An unexpected error ocurred, please try again later.'
  }catch(err){
    return 'An unexpected error ocurred, please try again later.'
  }
}
