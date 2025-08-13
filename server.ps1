# Improved HTTP server script to handle Next.js dynamic routes
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:3001/')  # Using port 3001
$listener.Start()
Write-Host 'Server started at http://localhost:3001/'

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $requestUrl = $context.Request.Url.LocalPath
        $response = $context.Response
        
        # Special case for the dynamic route JavaScript file
        if ($requestUrl -eq "/_next/static/chunks/pages/project/[uid]-e5bfd33146dfc638.js") {
            Write-Host "Handling special case for dynamic route JS file"
            
            # Define the directory where the file should be
            $directory = Join-Path $PWD.Path "_next\static\chunks\pages\project"
            
            # Check if the directory exists
            if (Test-Path $directory -PathType Container) {
                # Look for the file with the exact name including brackets
                $filePath = Join-Path $directory "[uid]-e5bfd33146dfc638.js"
                
                if (Test-Path $filePath -PathType Leaf) {
                    # File found, serve it
                    $content = [System.IO.File]::ReadAllBytes($filePath)
                    $response.ContentType = "application/javascript"
                    $response.ContentLength64 = $content.Length
                    $response.OutputStream.Write($content, 0, $content.Length)
                    Write-Host "Successfully served dynamic route JS file"
                } else {
                    # File not found with exact name, try alternative approaches
                    Write-Host "File not found with exact name, trying alternative approaches"
                    
                    # Option 1: Try to find any file that ends with the same pattern
                    $files = Get-ChildItem -Path $directory -Filter "*-e5bfd33146dfc638.js" -ErrorAction SilentlyContinue
                    
                    if ($files.Count -gt 0) {
                        # Use the first matching file
                        $filePath = $files[0].FullName
                        $content = [System.IO.File]::ReadAllBytes($filePath)
                        $response.ContentType = "application/javascript"
                        $response.ContentLength64 = $content.Length
                        $response.OutputStream.Write($content, 0, $content.Length)
                        Write-Host "Successfully served dynamic route JS file using pattern matching"
                    } else {
                        # No matching file found
                        Write-Host "No matching file found for dynamic route JS"
                        $response.StatusCode = 404
                    }
                }
            } else {
                # Directory not found
                Write-Host "Directory not found: $directory"
                $response.StatusCode = 404
            }
        }
        # Original handling for other requests
        elseif ($requestUrl -eq '/') {
            $requestUrl = '/index.html'
            $filePath = Join-Path $PWD.Path $requestUrl.Substring(1)
            # Process the file normally below
        } elseif ($requestUrl.StartsWith('/_next/')) {
            $filePath = Join-Path $PWD.Path $requestUrl.Substring(1)
            # Process the file normally below
        } elseif ($requestUrl.StartsWith('/project/')) {
            $projectPath = $requestUrl.Substring('/project/'.Length)
            if (-not $projectPath.EndsWith('.html')) {
                $projectPath = $projectPath + '.html'
            }
            $filePath = Join-Path $PWD.Path 'project' $projectPath
            # Process the file normally below
        } else {
            $filePath = Join-Path $PWD.Path $requestUrl.Substring(1)
            # Process the file normally below
        }
        
        # Original file serving logic for non-special cases
        if ($requestUrl -ne "/_next/static/chunks/pages/project/[uid]-e5bfd33146dfc638.js") {
            Write-Host "Requested: $requestUrl, Serving: $filePath"
            if (Test-Path $filePath -PathType Leaf) {
                try {
                    $content = [System.IO.File]::ReadAllBytes($filePath)
                    $response.ContentType = switch -Regex ($filePath) {
                        '\.(html|htm)$' {'text/html'}
                        '\.(jpg|jpeg)$' {'image/jpeg'}
                        '\.png$' {'image/png'}
                        '\.css$' {'text/css'}
                        '\.js$' {'application/javascript'}
                        '\.json$' {'application/json'}
                        '\.woff2$' {'font/woff2'}
                        '\.svg$' {'image/svg+xml'}
                        '\.ico$' {'image/x-icon'}
                        '\.glb$' {'model/gltf-binary'}
                        '\.hdr$' {'application/octet-stream'}
                        default {'application/octet-stream'}
                    }
                    
                    # Fix for content length issue
                    $contentLength = $content.Length
                    $response.ContentLength64 = $contentLength
                    $response.OutputStream.Write($content, 0, $contentLength)
                }
                catch {
                    Write-Host "Error serving file: $_"
                    $response.StatusCode = 500
                }
            } else {
                Write-Host "File not found: $filePath"
                $response.StatusCode = 404
            }
        }
    }
    catch {
        Write-Host "Error processing request: $_"
        try {
            $response.StatusCode = 500
        }
        catch {
            # Response might already be closed
        }
    }
    finally {
        # Ensure response is closed even if an error occurs
        try {
            $response.Close()
        }
        catch {
            # Response might already be closed
        }
    }
}