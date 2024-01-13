import pool from "./db.js";

class Prediction {
  /**
   * @param {Object} param0
   * @param {string} param0.id
   * @param {string} param0.uploadUrl
   * @param {string} param0.resultUrl
   * @param {Date} param0.createdAt
   * @param {Date} param0.updatedAt
   */
  constructor({ id, uploadUrl, resultUrl, createdAt, updatedAt } = {}) {
    this.id = id;
    this.uploadUrl = uploadUrl;
    this.resultUrl = resultUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.client = undefined;
  }

  /**
   * Save the detection to the database
   * @returns {Promise<void>}
   */
  async save() {
    if (!this.client) {
      this.client = await pool.connect();
    }

    const query = `INSERT INTO predictions (id, upload_url, result_url) VALUES ($1, $2, $3)`;
    const values = [this.id, this.uploadUrl, this.resultUrl];
    await this.client.query(query, values);
  }

  /**
   * Update the detection in the database
   * @returns {Promise<Prediction[]>}
   */
  async getAll() {
    if (!this.client) {
      this.client = await pool.connect();
    }

    const query = `SELECT id, upload_url, result_url, created_at, updated_at FROM predictions`;
    const result = await this.client.query(query);
    const predictions = result.rows.map(
      (row) =>
        new Prediction({
          id: row.id,
          uploadUrl: row.upload_url,
          resultUrl: row.result_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
    );

    return predictions;
  }
}

export default Prediction;
