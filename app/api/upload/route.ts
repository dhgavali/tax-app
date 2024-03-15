import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";
// import { PDFDocument } from 'pdf-lib';
import { Blob } from "buffer";

export async function POST(req: NextRequest) {
  const formData: FormData = await req.formData();
  const uploadedFiles = formData.getAll("filepond");
  let fileName = "";
  let parsedText = "";

  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[1];
    console.log("Uploaded file:", uploadedFile);

    if (uploadedFile instanceof Blob) {
      fileName = uuidv4();

      // const tempFilePath = `/tmp/${fileName}.pdf`;

      // const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
      // const fileBuffer = await Buffer.from(await uploadedFile.arrayBuffer());
      const tempFilePath = `/tmp/${fileName}.pdf`;
      await fs.writeFile(tempFilePath, fileBuffer);

      // await fs.writeFile(tempFilePath, fileBuffer);

      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) =>
        console.log(errData.parserError)
      );

      pdfParser.on("pdfParser_dataReady", () => {
        parsedText = (pdfParser as any).getRawTextContent();
        const refNoMatch = parsedText.match(/Reference No: (\d+)/);
        const refNo = refNoMatch ? refNoMatch[1] : "";
        // getting the date
        const dateRegex = /(\d{2}-\d{2}-\d{4})/;
        const dateMatch = parsedText.match(dateRegex);
        const date = dateMatch ? dateMatch[0] : ""; // Example regex to extract date
        
        const nameMatch = parsedText.match(/Name of Company:(\s+)/ )
        const companyName = nameMatch ? nameMatch[1] : "";



        // const data = {
        //   "reference_no" : refNo,
        //   "date_of_application" : date,
        //   "kind_of_busines" : ""
        // }
        console.log(refNo, date, nameMatch);
      });

      pdfParser.loadPDF(tempFilePath);
    } else {
      console.log("Uploaded file is not in the expected format.");
    }
  } else {
    console.log("No files found.");
  }

  const response = new NextResponse(parsedText);
  response.headers.set("FileName", fileName);
  //   console.log("r4esponse", response);
  return response;
}
