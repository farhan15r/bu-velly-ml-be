import pool from "./db.js";
import NotFoundError from "./../exceptions/NotFoundError.js";
import PredictionLabel from "./PredictionLabel.js";

class PredictionLabels {
  #client;

  transform(predictionId, predictionLabels = [PredictionLabel]) {
    this.predictionLabels = [];

    predictionLabels.forEach((label, i) => {
      const predictionLabel = new PredictionLabel({
        predictionId,
        objectIndex: i,
        label,
      });

      this.predictionLabels.push(predictionLabel);
    });

    return this;
  }

  async saveAll() {
    if (!this.#client) {
      this.#client = await pool.connect();
    }

    const colSize = 3;
    const valuesPlaceHolder = this.predictionLabels
      .map(
        (_, index) =>
          `($${index * colSize + 1}, $${index * colSize + 2}, $${
            index * colSize + 3
          })`
      )
      .join(", ");

    const query = `INSERT INTO prediction_labels (prediction_id, object_index, label) VALUES ${valuesPlaceHolder}`;

    const values = this.predictionLabels.reduce((acc, predictionLabel) => {
      acc.push(predictionLabel.predictionId);
      acc.push(predictionLabel.objectIndex);
      acc.push(predictionLabel.label);
      return acc;
    }, []);

    await this.#client.query(query, values);

    await this.#client.release();
  }

  async getAllByPredictionId(predictionId) {
    try {
      if (!this.#client) {
        this.#client = await pool.connect();
      }

      const query = `SELECT * FROM prediction_labels WHERE prediction_id = $1 ORDER BY object_index`;
      const { rows } = await this.#client.query(query, [predictionId]);

      if (rows.length === 0) {
        throw new NotFoundError("Prediction Labels not found");
      }

      this.predictionLabels = rows;

      return this;
    } catch (error) {
      throw error;
    } finally {
      this.#client.release();
    }
  }
}

export default PredictionLabels;
