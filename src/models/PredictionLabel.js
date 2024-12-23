class PredictionLabel {
  /**
   * @param {Object} param0
   * @param {string} param0.id
   * @param {string} param0.predictionId
   * @param {number} param0.objectIndex
   * @param {string} param0.label
   */
  constructor({ id, predictionId, objectIndex, label } = {}) {
    this.id = id;
    this.predictionId = predictionId;
    this.objectIndex = objectIndex;
    this.label = label;
  }
}

export default PredictionLabel;
