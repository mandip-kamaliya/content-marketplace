import fetch from 'node-fetch';

const TX_ID = "0xc2bac4ba2b4828ab6f325a7e4531fcc1896c0da5af9d51d05ab0afadf3beb914";
const API_URL = "https://api.testnet.hiro.so";

async function checkTx() {
    try {
        const url = `${API_URL}/extended/v1/tx/${TX_ID}`;
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);

        if (response.status === 404) {
            console.log("❌ Transaction not found (Mempool might have dropped it or it's invalid).");
            return;
        }

        const data = await response.json();
        console.log(`Status: ${data.tx_status}`);

        if (data.tx_status === "pending") {
            console.log("⏳ Transaction is still pending. The network is congested or slow.");
        } else if (data.tx_status === "success") {
            console.log("✅ Transaction successful!");
            console.log(`Contract Address: ${data.smart_contract.contract_id}`);
        } else {
            console.log(`❌ Transaction failed.`);
            console.log(`Status: ${data.tx_status}`);
            console.log(`Result: ${JSON.stringify(data.tx_result)}`);
            // console.log(`Full Data: ${JSON.stringify(data)}`); // Commented out to reduce noise
        }
    } catch (error) {
        console.error("Error fetching tx:", error);
    }
}

checkTx();
