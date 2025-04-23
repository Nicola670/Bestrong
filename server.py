from flask import Flask, request, render_template

app = Flask(__name__)
app.config["DEBUG"] = True


@app.route('/')
def home():
    appName = "BeStrong"
    return render_template("home.html", appName = appName)

if __name__ == "__main__":
    app.run()