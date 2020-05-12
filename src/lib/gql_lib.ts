import axios from "axios"

let host: string
if (process.env.NODE_ENV == "development") {
    host = window.location.host.substr(0, window.location.host.indexOf(":")) + ":3000"
} else {
    host = window.location.host
}

export default async function gql(request: String, variables: any = {}) {
    let address =  "http://" + host + "/graphql"
    return axios.post(address, {
        query: request,
        variables: variables
    })
}