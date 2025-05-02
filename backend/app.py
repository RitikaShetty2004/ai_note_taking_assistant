from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import whisper
from pydub import AudioSegment
import traceback
from transformers import pipeline  # Local summarization

# Flask setup
app = Flask(__name__)
CORS(app)

# Configurations
app.config['UPLOAD_FOLDER'] = './uploads'
app.config['ALLOWED_EXTENSIONS'] = {'wav', 'mp3', 'ogg'}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load Local Whisper Model
whisper_model = whisper.load_model("base")  

# Load Local Summarization Model (Facebook BART)
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Check allowed file
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/upload', methods=['POST'])
def upload_audio():
    """ Handles file upload and transcription using Whisper """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            # Convert to WAV
            wav_path = convert_to_wav(filepath)

            # Transcribe using Whisper
            transcription = transcribe_audio(wav_path)

            return jsonify({'transcription': transcription}), 200
        except Exception as e:
            traceback.print_exc()
            return jsonify({'error': f'Processing failed: {str(e)}'}), 500

    return jsonify({'error': 'Invalid file format'}), 400

def convert_to_wav(filepath):
    """ Convert any audio file to WAV format. """
    try:
        wav_path = filepath.rsplit('.', 1)[0] + ".wav"
        audio = AudioSegment.from_file(filepath)
        audio.export(wav_path, format="wav")
        return wav_path
    except Exception as e:
        raise Exception(f"Audio conversion error: {str(e)}")

def transcribe_audio(filepath):
    """ Transcribe audio using Whisper locally. """
    try:
        result = whisper_model.transcribe(filepath)
        return result["text"]
    except Exception as e:
        raise Exception(f"Transcription error: {str(e)}")

@app.route('/summarize', methods=['POST'])
def summarize_text():
    """ Summarizes the transcription locally using BART. """
    try:
        # Get the JSON data sent in the POST request
        data = request.json
        print(f"Received data: {data}")  # Debugging statement
        text = data.get("text", "")

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Summarize using local BART model
        summary = summarizer(text, max_length=150, min_length=50, do_sample=False)

        return jsonify({'summary': summary[0]['summary_text']}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Summary generation failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
