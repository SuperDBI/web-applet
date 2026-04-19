import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.Part;

public class GenAiPdfQuery {

  public static void main(String[] args) {
    // TODO: Replace the model ID and PDF URI with your values.
    String modelId = "gemini-2.5-flash";
    String pdfUri = "gs://your-bucket/your-file.pdf";
    String prompt = "contents: [PDF, 'What colleges or universities are reaches, targets or safety schools to apply for admission?'], list 5 schools for each category (reach, target, safety) then returns a neat and clean result to match.html in an <iframe>. The results should also provide a summary of why the AI prompt selected such schools according to PDF data";

    String result = generateContent(modelId, pdfUri, prompt);
    System.out.println(result);
  }

  public static String generateContent(String modelId, String pdfUri, String prompt) {
    try (Client client =
        Client.builder()
            .location("global")
            .vertexAI(true)
            .httpOptions(HttpOptions.builder().apiVersion("v1").build())
            .build()) {

      GenerateContentResponse response =
          client.models.generateContent(
              modelId,
              Content.fromParts(
                  Part.fromText(prompt),
                  Part.fromUri(pdfUri, "application/pdf")),
              null);

      return response.text();
    }
  }
}
