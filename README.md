# smart-address

# SmartAddress: Dynamic Autocomplete with DaData API in TypeScript

## Project Overview
An address autocomplete functionality using [DaData API](https://dadata.ru/api/suggest/address/). 

## Technical Details
The key technologies used are TypeScript and DaData API. A specific requirement of the project was to add no libraries. For this reason, the project includes its own debounce functionality. 

## Key Features
An input field listens for address input. When the user types a letter, the function makes an API call and displays the address suggestions once fetched. The user may accept any suggestion and/or continue typing and see more suggestions. 

The input is debounced. If the second API request comes while the first one is not complete, the first one gets aborted. The API takes care of the maximum length of suggestions list and filters the most relevant suggestions. 

## Usage
The API token is not included in this code, and neither is the function that calls the API. To obtain and use one's own API token, visit the [DaData website](https://dadata.ru/api/suggest/address/). This website also gives instructions and code to make an API call. In case of any questions, please contact the repo owner. 

You are welcome to learn from this code, but it cannot be used for commercial purposes without permission.

