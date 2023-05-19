export default class BjorliAPI{
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.axios = axios.create({
            baseURL: this.baseURL,
            //withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    async fetchGameData(year, month) {
        try {
            const response = await this.axios.get(`/${year}/${month}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching game data:", error);
            throw error;
        }
    }

    async fetchGameOptions() {
        try {
            const response = await this.axios.get('/alleleika');
            return response.data;
        } catch (error) {
            console.error("Error fetching game options:", error);
            throw error;
        }
    }

    async saveGameData(year, month, data) {
        try {
            const response = await this.axios.post(`/${year}/${month}`, data);
            return response.data;
        } catch (error) {
            console.error("Error saving game data:", error);
            throw error;
        }
    }
}

