#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_LINE_LENGTH 1024

// Function to check if a line contains a BOM (Byte Order Mark)
int contains_bom(const char *line) {
    // Check for UTF-8 BOM (EF BB BF)
    if (strlen(line) >= 3 && 
        (unsigned char)line[0] == 0xEF &&
        (unsigned char)line[1] == 0xBB &&
        (unsigned char)line[2] == 0xBF) {
        return 1;
    }
    return 0;
}

// Function to process a PDF file and check for BOM
void process_pdf_file(const char *input_file, const char *output_file) {
    FILE *input = fopen(input_file, "rb");
    FILE *output = fopen(output_file, "wb");

    if (!input || !output) {
        perror("Error opening file");
        exit(EXIT_FAILURE);
    }

    char line[MAX_LINE_LENGTH];
    int line_number = 0;
    int bom_found = 0;

    while (fgets(line, sizeof(line), input)) {
        line_number++;
        
        if (contains_bom(line)) {
            printf("BOM found at line %d\n", line_number);
            bom_found = 1;
            // Remove BOM by skipping the first 3 bytes
            fwrite(line + 3, 1, strlen(line) - 3, output);
        } else {
            fwrite(line, 1, strlen(line), output);
        }
    }

    fclose(input);
    fclose(output);

    if (!bom_found) {
        printf("No BOM found in the file.\n");
    }
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: %s <input_pdf_file> <output_pdf_file>\n", argv[0]);
        return EXIT_FAILURE;
    }

    const char *input_file = argv[1];
    const char *output_file = argv[2];

    process_pdf_file(input_file, output_file);

    return EXIT_SUCCESS;
}