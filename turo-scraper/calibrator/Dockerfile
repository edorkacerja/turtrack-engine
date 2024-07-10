FROM python:3.11.4-slim-bullseye

WORKDIR /usr/src/app

# Install gnupg for key management
RUN apt-get update && apt-get install -y gnupg

# Update GPG keys
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 648ACFD622F3D138 0E98404D386FA1D9 605C66F00D6C9793

# Force IPv4 for apt
RUN echo 'Acquire::ForceIPv4 "true";' | tee /etc/apt/apt.conf.d/99force-ipv4

# Use a specific mirror
RUN echo "deb http://ftp.de.debian.org/debian bullseye main" > /etc/apt/sources.list

COPY requirements.txt .

# Install system dependencies required for GDAL and build tools
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the GDAL environment variables
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5003

CMD ["python3", "src/server.py"]