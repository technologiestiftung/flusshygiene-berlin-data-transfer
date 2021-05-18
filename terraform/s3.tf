resource "aws_s3_bucket" "uploads" {
  bucket        = "${var.prefix}-${var.name}-${var.env}"
  acl           = "public-read"
  force_destroy = true
  versioning {
    enabled = false
  }

  policy = jsonencode({
    "Version" = "2012-10-17"
    "Id"      = "Policy-public-read-1"
    "Statement" = [
      {
        "Sid"    = "AllowPublicRead"
        "Effect" = "Allow"
        "Principal" = {
          "AWS" = "*"
        }
        "Action"   = "s3:GetObject"
        "Resource" = "arn:aws:s3:::${var.prefix}-${var.name}-${var.env}/*"
      }
    ]
  })

  #  policy = <<POLICY
  #  {
  #    "Version": "2012-10-17",
  #    "Id": "Policy-public-read-1",
  #    "Statement": [
  #        {
  #            "Sid": "AllowPublicRead",
  #            "Effect": "Allow",
  #            "Principal": {
  #                "AWS": "*"
  #            },
  #            "Action": "s3:GetObject",
  #            "Resource": "arn:aws:s3:::${var.prefix}-${var.name}-${var.env}/*"
  #        }
  #    ]
  #  }
  #  POLICY
  #  # Should be added for production
  cors_rule {
   allowed_headers = ["*"]
   allowed_methods = ["GET"]
   allowed_origins = "${var.allowed_origins}"

   expose_headers  = ["ETag"]
   max_age_seconds = 6000
  }

  tags = {
    name    = "terraform bucket for data from berliner wasser betriebe"
    project = "flsshygn"
    type    = "storage"
  }

}

