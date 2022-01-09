#!/bin/bash
export NPM_TOKEN=$(echo -n "${NPM_USERNAME}:${NPM_PASSWORD}" | openssl base64)
echo "_auth=${NPM_TOKEN}" >> ~/.npmrc

export PACKAGE_NAME=$(cat package.json | jq -r '.name')
export SOURCE_VERSION=$(cat package.json | jq -r '.version')
export PUBLISHED_VERSION=$(npm view ${PACKAGE_NAME} version)

echo "NPM Package: ${PACKAGE_NAME}"
echo "Source Version: ${SOURCE_VERSION}"
echo "Published Version: ${PUBLISHED_VERSION}"

# If running OSX replace tac with tail -r
export HIGHEST_VERSION=$(printf '%s\n' "$PUBLISHED_VERSION" "$SOURCE_VERSION" | sort -V | tac | head -n1)

if [ "$SOURCE_VERSION" = "$HIGHEST_VERSION" -a "$SOURCE_VERSION" != "$PUBLISHED_VERSION" ]; then 
    npm publish
else
    echo "No version change needed"
fi


